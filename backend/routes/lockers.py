from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import get_db_connection

lockers_bp = Blueprint('lockers', __name__)

@lockers_bp.route('/lockers', methods=['GET'])
@jwt_required()
def get_lockers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT l.*, u.room_number, u.phone, u.fullname 
        FROM lockers l 
        LEFT JOIN users u ON l.user_id = u.user_id
    """)
    lockers = cursor.fetchall()
    conn.close()
    return jsonify(lockers), 200

@lockers_bp.route('/lockers/<int:locker_id>', methods=['PUT'])
@jwt_required()
def update_locker(locker_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # ตัวอย่าง: อนุญาตให้ admin เปลี่ยนสถานะหรือบังคับเปิดตู้
    if 'status' in data:
        cursor.execute("UPDATE lockers SET status = %s WHERE locker_id = %s", (data['status'], locker_id))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Updated'}), 200

@lockers_bp.route('/lockers/<int:locker_id>/force-open', methods=['POST'])
@jwt_required()
def force_open(locker_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE lockers SET status = 0 WHERE locker_id = %s", (locker_id,))
    cursor.execute("""
        INSERT INTO transactions (locker_id, action, detail, timestamp)
        VALUES (%s, 'admin_force_open', 'เปิดตู้ด้วยมือโดย admin', NOW())
    """, (locker_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Locker forced open'}), 200