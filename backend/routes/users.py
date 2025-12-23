from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import get_db_connection

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    conn.close()
    return jsonify(users), 200

@users_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE users SET 
            room_number = %s, phone = %s, fullname = %s, note = %s
        WHERE user_id = %s
    """, (data['room_number'], data['phone'], data['fullname'], data['note'], user_id))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'User updated'}), 200