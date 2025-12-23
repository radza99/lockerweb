from flask import Flask, request, jsonify, session
from flask_cors import CORS
import mysql.connector
from datetime import timedelta
from mysql.connector import Error

app = Flask(__name__)
app.secret_key = 'super-secret-key-เปลี่ยนเป็นอะไรก็ได้ที่ปลอดภัย'

# ตั้งค่า Session ให้หมดอายุเมื่อปิดเบราว์เซอร์
app.config['SESSION_PERMANENT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=20)  # สูงสุด 30 นาที
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # เปลี่ยนเป็น True เมื่อใช้ HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True

CORS(app, supports_credentials=True)

def get_db():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='1234',
            database='db_safe_locker'
        )
        return conn
    except Error as e:
        print(f"Database error: {e}")
        return None

# ====================== Admin Authentication ======================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == 'admin' and password == 'admin123':
        session['admin_logged_in'] = True
        session.permanent = False  # หมดอายุเมื่อปิดเบราว์เซอร์
        return jsonify({'success': True, 'message': 'เข้าสู่ระบบสำเร็จ'})
    else:
        return jsonify({'success': False, 'message': 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'}), 401

@app.route('/api/admin/check', methods=['GET'])
def check_login():
    if session.get('admin_logged_in'):
        return jsonify({'authenticated': True})
    return jsonify({'authenticated': False}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    return jsonify({'success': True})

# ====================== Admin Dashboard & Lockers ======================

@app.route('/api/admin/dashboard', methods=['GET'])
def dashboard():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) as total FROM lockers")
    total_lockers = cursor.fetchone()['total']

    cursor.execute("SELECT COUNT(*) as occupied FROM lockers WHERE status = 1")
    occupied = cursor.fetchone()['occupied']

    cursor.execute("SELECT COUNT(*) as total_users FROM users")
    total_users = cursor.fetchone()['total_users']

    cursor.close()
    conn.close()

    return jsonify({
        'total_lockers': total_lockers,
        'occupied': occupied,
        'available': total_lockers - occupied,
        'total_users': total_users
    })

@app.route('/api/lockers', methods=['GET'])
def get_lockers():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database error'}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT l.locker_id, l.status, l.phone_owner, l.deposit_time,
               u.fullname, u.room_number
        FROM lockers l
        LEFT JOIN users u ON l.user_id = u.user_id
        ORDER BY l.locker_id
    """)
    lockers = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(lockers)

@app.route('/api/lockers/<int:locker_id>/force-open', methods=['POST'])
def force_open(locker_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database error'}), 500

    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO transactions (locker_id, action, detail)
            VALUES (%s, 'admin_force_open', 'เปิดตู้ด้วยมือโดย admin')
        """, (locker_id,))

        cursor.execute("""
            UPDATE lockers
            SET status = 0, phone_owner = NULL, user_id = NULL, deposit_time = NULL
            WHERE locker_id = %s
        """, (locker_id,))

        conn.commit()
        return jsonify({'success': True, 'message': 'เปิดตู้สำเร็จแล้ว'})
    finally:
        cursor.close()
        conn.close()

# ====================== Users Management ======================

@app.route('/api/users', methods=['GET'])
def get_users():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database error'}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT user_id, room_number, phone, fullname, note, active, created_at FROM users ORDER BY user_id")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(users)

@app.route('/api/users', methods=['POST'])
def add_user():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    room_number = data.get('room_number', '').strip()
    phone = data.get('phone', '').strip()
    passcode = data.get('passcode', '').strip()
    fullname = data.get('fullname', '').strip()
    note = data.get('note', '').strip()
    active = data.get('active', 1)

    if not phone or not passcode:
        return jsonify({'success': False, 'message': 'กรุณากรอกเบอร์โทรและรหัสผ่าน'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (room_number, phone, passcode, fullname, note, active)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (room_number, phone, passcode, fullname, note, active))
        conn.commit()
        return jsonify({'success': True, 'message': 'เพิ่มผู้ใช้สำเร็จ'})
    except mysql.connector.IntegrityError:
        return jsonify({'success': False, 'message': 'เบอร์โทรนี้มีในระบบแล้ว'}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()

    conn = get_db()
    cursor = conn.cursor()

    try:
        # ตรวจสอบว่ามีผู้ใช้จริงไหม
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'ไม่พบผู้ใช้'}), 404

        # สร้าง query อัปเดตแบบ dynamic
        updates = []
        params = []

        if 'room_number' in data:
            updates.append("room_number = %s")
            params.append(data['room_number'])
        if 'phone' in data:
            updates.append("phone = %s")
            params.append(data['phone'])
        if 'fullname' in data:
            updates.append("fullname = %s")
            params.append(data['fullname'])
        if 'note' in data:
            updates.append("note = %s")
            params.append(data['note'])
        if 'active' in data:
            updates.append("active = %s")
            params.append(data['active'])
        if 'passcode' in data:  # รองรับการเปลี่ยนรหัสผ่าน
            updates.append("passcode = %s")
            params.append(data['passcode'])

        if not updates:
            return jsonify({'success': False, 'message': 'ไม่มีข้อมูลให้อัปเดต'}), 400

        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s"

        cursor.execute(query, params)
        conn.commit()
        return jsonify({'success': True, 'message': 'แก้ไขสำเร็จ'})
    except mysql.connector.IntegrityError:
        return jsonify({'success': False, 'message': 'เบอร์โทรนี้มีในระบบแล้ว'}), 400
    finally:
        cursor.close()
        conn.close()

# ====================== User Features ======================

@app.route('/api/user/login', methods=['POST'])
def user_login():
    data = request.get_json()
    phone = data.get('phone', '').strip()
    passcode = data.get('passcode', '').strip()

    conn = get_db()
    if not conn:
        return jsonify({'success': False, 'message': 'เชื่อมต่อฐานข้อมูลล้มเหลว'}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT user_id, room_number, phone, fullname 
        FROM users 
        WHERE phone = %s AND passcode = %s AND active = 1
    """, (phone, passcode))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        return jsonify({'success': True, 'user': user})
    else:
        return jsonify({'success': False, 'message': 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง'}), 401

@app.route('/api/user/dashboard', methods=['GET'])
def user_dashboard():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database error'}), 500

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT user_id, room_number, phone, fullname FROM users WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()

    cursor.execute("SELECT locker_id, deposit_time FROM lockers WHERE user_id = %s AND status = 1", (user_id,))
    current_locker = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as available FROM lockers WHERE status = 0")
    available = cursor.fetchone()['available']

    cursor.close()
    conn.close()

    if user:
        return jsonify({
            'user': user,
            'current_locker': current_locker,
            'available_lockers': available
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/user/deposit', methods=['POST'])
def user_deposit():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'ไม่พบผู้ใช้'}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT locker_id FROM lockers WHERE status = 0 LIMIT 1")
    locker = cursor.fetchone()

    if locker:
        locker_id = locker[0]
        cursor.execute("""
            UPDATE lockers 
            SET status = 1, phone_owner = (SELECT phone FROM users WHERE user_id = %s), 
                user_id = %s, deposit_time = NOW()
            WHERE locker_id = %s
        """, (user_id, user_id, locker_id))

        cursor.execute("""
            INSERT INTO transactions (locker_id, user_id, phone, action, detail)
            VALUES (%s, %s, (SELECT phone FROM users WHERE user_id = %s), 'deposit', 'ฝากของโดยผู้ใช้')
        """, (locker_id, user_id, user_id))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'locker_id': locker_id, 'message': f'ฝากของสำเร็จ ตู้หมายเลข {locker_id}'})
    else:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'ไม่มีตู้ว่าง'}), 400

@app.route('/api/user/withdraw', methods=['POST'])
def user_withdraw():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'ไม่พบผู้ใช้'}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT locker_id FROM lockers WHERE user_id = %s AND status = 1", (user_id,))
    locker = cursor.fetchone()

    if locker:
        locker_id = locker[0]
        cursor.execute("""
            UPDATE lockers 
            SET status = 0, phone_owner = NULL, user_id = NULL, deposit_time = NULL
            WHERE locker_id = %s
        """, (locker_id,))

        cursor.execute("""
            INSERT INTO transactions (locker_id, user_id, phone, action, detail)
            VALUES (%s, %s, (SELECT phone FROM users WHERE user_id = %s), 'withdraw', 'ถอนของโดยเจ้าของ')
        """, (locker_id, user_id, user_id))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': 'ถอนของสำเร็จ'})
    else:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'คุณไม่มีตู้ที่ใช้งานอยู่'}), 400
    
 # ====================== ลบผู้ใช้ ======================
# ====================== ลบผู้ใช้ ======================

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database error'}), 500

    cursor = conn.cursor()

    try:
        # ลบ transaction ที่เกี่ยวข้องก่อน (เพื่อหลีกเลี่ยง foreign key error)
        cursor.execute("""
            DELETE FROM transactions 
            WHERE locker_id IN (
                SELECT locker_id FROM lockers WHERE user_id = %s
            )
        """, (user_id,))

        # รีเซ็ตตู้ที่ผู้ใช้นี้กำลังใช้งาน
        cursor.execute("""
            UPDATE lockers 
            SET status = 0, phone_owner = NULL, user_id = NULL, deposit_time = NULL 
            WHERE user_id = %s
        """, (user_id,))

        # ลบผู้ใช้จริง
        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'ไม่พบผู้ใช้ที่ต้องการลบ'}), 404
        
        conn.commit()
        return jsonify({'success': True, 'message': 'ลบผู้ใช้สำเร็จ (ข้อมูลเกี่ยวข้องถูกลบแล้ว)'})
    except Exception as e:
        conn.rollback()
        print(f"Error deleting user {user_id}: {e}")
        return jsonify({'success': False, 'message': 'เกิดข้อผิดพลาดในการลบผู้ใช้'}), 500
    finally:
        cursor.close()
        conn.close()
# ====================== Run Server ======================

if __name__ == '__main__':
    app.run(debug=True, port=5000)