import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    room_number: '', 
    phone: '', 
    passcode: '',      // สำหรับเพิ่มผู้ใช้ใหม่หรือเปลี่ยนรหัส
    new_passcode: '',  // เฉพาะตอนแก้ไข (optional)
    fullname: '', 
    note: '', 
    active: 1
  });
  
  const navigate = useNavigate();

  const fetchUsers = () => {
    axios.get('/users')
      .then(res => setUsers(res.data))
      .catch(() => navigate('/login'));
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    let payload = { ...formData };

    // ถ้าเป็นการแก้ไข และไม่ได้กรอกรหัสใหม่ → ลบ field ออก เพื่อไม่ให้อัปเดต passcode
    if (editingUser && !formData.new_passcode) {
      delete payload.passcode;
      delete payload.new_passcode;
    } else if (editingUser && formData.new_passcode) {
      // ใช้ชื่อ field เป็น passcode สำหรับ backend
      payload.passcode = formData.new_passcode;
      delete payload.new_passcode;
    }

    const url = editingUser ? `/users/${editingUser.user_id}` : '/users';
    const method = editingUser ? axios.put : axios.post;

    method(url, payload)
      .then(res => {
        alert(res.data.message || (editingUser ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ'));
        setShowForm(false);
        setEditingUser(null);
        setFormData({ 
          room_number: '', phone: '', passcode: '', new_passcode: '', 
          fullname: '', note: '', active: 1 
        });
        fetchUsers();
      })
      .catch(err => {
        alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
      });
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      room_number: user.room_number,
      phone: user.phone,
      passcode: '',           // ไม่ต้องกรอกตอนเพิ่ม
      new_passcode: '',       // สำหรับเปลี่ยนรหัสใหม่ (optional)
      fullname: user.fullname || '',
      note: user.note || '',
      active: user.active
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ 
      room_number: '', phone: '', passcode: '', new_passcode: '', 
      fullname: '', note: '', active: 1 
    });
  };

  return (
    <>
      <Navbar />
      <div className="container">
        
        <h2>จัดการผู้ใช้</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)} 
          style={{marginBottom: '1.5rem', fontSize: '1.1rem', padding: '0.8rem 1.5rem',marginTop:'1rem'}}
        >
          + เพิ่มผู้ใช้ใหม่
        </button>

        {showForm && (
          <div style={{
            background: 'white', 
            padding: '2.5rem', 
            borderRadius: '16px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
            marginBottom: '3rem'
          }}>
            <h4 style={{marginBottom: '1.5rem', color: '#2c3e50'}}>
              {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
            </h4>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>ห้อง</label>
                <input 
                  type="text" 
                  value={formData.room_number} 
                  onChange={e => setFormData({...formData, room_number: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>เบอร์โทร</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  required 
                />
              </div>

              {/* รหัสผ่าน - บังคับกรอกตอนเพิ่มผู้ใช้ใหม่ */}
              {!editingUser && (
                <div className="form-group">
                  <label>รหัสผ่าน (Passcode)</label>
                  <input 
                    type="text" 
                    value={formData.passcode} 
                    onChange={e => setFormData({...formData, passcode: e.target.value})} 
                    required 
                    placeholder="เช่น 1234"
                  />
                </div>
              )}

              {/* เปลี่ยนรหัสผ่านใหม่ - เฉพาะตอนแก้ไข (ไม่บังคับ) */}
              {editingUser && (
                <div className="form-group">
                  <label>เปลี่ยนรหัสผ่านใหม่ (ถ้าต้องการ)</label>
                  <input 
                    type="text" 
                    value={formData.new_passcode} 
                    onChange={e => setFormData({...formData, new_passcode: e.target.value})} 
                    placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                  />
                  <small style={{color: '#7f8c8d', fontStyle: 'italic'}}>
                    ถ้าไม่กรอก จะคงรหัสผ่านเดิมไว้
                  </small>
                </div>
              )}

              <div className="form-group">
                <label>ชื่อ-นามสกุล</label>
                <input 
                  type="text" 
                  value={formData.fullname} 
                  onChange={e => setFormData({...formData, fullname: e.target.value})} 
                />
              </div>
              
              <div className="form-group">
                <label>โน๊ต</label>
                <textarea 
                  value={formData.note} 
                  onChange={e => setFormData({...formData, note: e.target.value})} 
                  rows="3" 
                  placeholder="ข้อมูลเพิ่มเติม..."
                />
              </div>

              <div className="form-group">
                <label style={{display: 'flex', alignItems: 'center', fontWeight: '500'}}>
                  <input 
                    type="checkbox" 
                    checked={formData.active} 
                    onChange={e => setFormData({...formData, active: e.target.checked ? 1 : 0})}
                    style={{marginRight: '0.8rem'}}
                  />
                  เปิดใช้งานผู้ใช้นี้
                </label>
              </div>

              <div style={{marginTop: '2rem'}}>
                <button type="submit" className="btn btn-primary" style={{padding: '0.9rem 2rem', fontSize: '1.1rem'}}>
                  {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
                </button>
                <button 
                  type="button" 
                  onClick={cancelForm} 
                  style={{
                    marginLeft: '1rem', 
                    padding: '0.9rem 2rem', 
                    backgroundColor: '#95a5a6', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    cursor: 'pointer'
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ตารางผู้ใช้ */}
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ห้อง</th>
              <th>เบอร์โทร</th>
              <th>ชื่อ-นามสกุล</th>
              <th>โน๊ต</th>
              <th>สถานะ</th>
              <th>สร้างเมื่อ</th>
              <th style={{textAlign: 'center'}}>การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.room_number}</td>
                <td>{user.phone}</td>
                <td>{user.fullname || '-'}</td>
                <td>{user.note || '-'}</td>
                <td>
                  {user.active ? 
                    <span className="badge badge-success">เปิดใช้งาน</span> : 
                    <span className="badge badge-danger">ปิดใช้งาน</span>
                  }
                </td>
                <td>{user.created_at}</td>
                <td style={{textAlign: 'center'}}>
                  <button 
                    className="btn btn-warning" 
                    onClick={() => startEdit(user)}
                    style={{padding: '0.6rem 1.2rem'}}
                  >
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}