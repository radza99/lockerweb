from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
import bcrypt
from models import get_db_connection

auth_bp = Blueprint('auth', __name__)

# ตัวอย่าง admin (เก็บใน settings หรือ hardcode ไว้ก่อน)
ADMIN_CREDENTIALS = {
    'username': 'admin',
    'password': bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
}

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username != 'admin' or not bcrypt.checkpw(password.encode('utf-8'), ADMIN_CREDENTIALS['password'].encode('utf-8')):
        return jsonify({'message': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=username)
    return jsonify({'access_token': access_token}), 200