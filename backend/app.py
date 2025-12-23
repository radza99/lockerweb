from flask import Flask, request, jsonify, session
from flask_cors import CORS
import mysql.connector
from datetime import timedelta
from mysql.connector import Error


app = Flask(__name__)
app.secret_key = 'super-secret-key-เปลี่ยนเป็นอะไรก็ได้ที่ปลอดภัย'
CORS(app, supports_credentials=True)  # สำคัญสำหรับ session + React
app.config['SESSION_PERMANENT'] = False  # สำคัญ! ทำให้ session ไม่ถาวร
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)  # อายุสูงสุด 30 นาที (ปรับได้)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # ถ้าใช้ HTTPS ให้เป็น True
app.config['SESSION_COOKIE_HTTPONLY'] = True

def get_db():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='1234',           # เปลี่ยนตามของคุณ
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
        session.permanent = False  # บังคับให้ session หมดอายุเมื่อปิดเบราว์เซอร์
        return jsonify({'success': True, 'message': 'เข้าสู่ระบบสำเร็จ'})
    else:
        return jsonify({'success': False, 'message': 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'}), 401

@app.route('/api/admin/check', methods=['GET'])
def check_login():
    if session.get('admin_logged_in'):
        return jsonify({'authenticated': True})
    return jsonify({'authenticated': False}), 401

@app.route('/api/admin/logout', methods=['POST'])
def logout():
    session.pop('admin_logged_in', None)
    return jsonify({'success': True})

# ====================== Dashboard & Lockers ======================

@app.route('/api/admin/dashboard', methods=['GET'])
def dashboard():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) as total FROM lockers")
    total = cursor.fetchone()['total']

    cursor.execute("SELECT COUNT(*) as occupied FROM lockers WHERE status = 1")
    occupied = cursor.fetchone()['occupied']

    cursor.execute("SELECT COUNT(*) as total_users FROM users")
    total_users = cursor.fetchone()['total_users']

    cursor.close()
    conn.close()

    return jsonify({
        'total_lockers': total,
        'occupied': occupied,
        'available': total - occupied,
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
    cursor.close()
    conn.close()

    return jsonify({'success': True, 'message': 'เปิดตู้สำเร็จแล้ว'})

# ====================== Users Management ======================

@app.route('/api/users', methods=['GET'])
def get_users():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database error'}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT user_id, room_number, phone, fullname, note, active, created_at
        FROM users
        ORDER BY user_id
    """)
    users = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(users)

@app.route('/api/users', methods=['POST'])
def add_user():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    room_number = data.get('room_number')
    phone = data.get('phone')
    passcode = data.get('passcode')
    fullname = data.get('fullname')
    note = data.get('note')
    active = data.get('active', 1)

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

    # 1. เช็กก่อนว่ามีผู้ใช้จริงไหม
    cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'ไม่พบผู้ใช้'}), 404

    # 2. อัปเดตข้อมูล
    try:
        cursor.execute("""
            UPDATE users
            SET room_number = %s,
                phone = %s,
                fullname = %s,
                note = %s,
                active = %s
            WHERE user_id = %s
        """, (
            data.get('room_number'),
            data.get('phone'),
            data.get('fullname'),
            data.get('note'),
            data.get('active'),
            user_id
        ))

        conn.commit()
        return jsonify({'success': True, 'message': 'แก้ไขสำเร็จ'})

    except mysql.connector.IntegrityError:
        return jsonify({'success': False, 'message': 'เบอร์โทรนี้มีในระบบแล้ว'}), 400

    finally:
        cursor.close()
        conn.close()

# ====================== User Features (ไม่ต้อง login admin) ======================

@app.route('/api/user/login', methods=['POST'])
def user_login():
    data = request.get_json()
    phone = data.get('phone')
    passcode = data.get('passcode')

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

    # ข้อมูลผู้ใช้
    cursor.execute("SELECT user_id, room_number, phone, fullname FROM users WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()

    # ตู้ที่ใช้งานอยู่
    cursor.execute("SELECT locker_id, deposit_time FROM lockers WHERE user_id = %s AND status = 1", (user_id,))
    current_locker = cursor.fetchone()

    # จำนวนตู้ว่าง
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

    # หาตู้ว่างตัวแรก
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

# ====================== Run Server ======================

if __name__ == '__main__':
    app.run(debug=True, port=5000)