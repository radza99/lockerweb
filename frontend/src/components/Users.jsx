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
    passcode: '',          // สำหรับเพิ่มผู้ใช้ใหม่ (บังคับ)
    new_passcode: '',      // สำหรับแก้ไข (optional)
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

    let payload = {
      room_number: formData.room_number.trim(),
      phone: formData.phone.trim(),
      fullname: formData.fullname.trim(),
      note: formData.note.trim(),
      active: formData.active
    };

    // ถ้าเพิ่มผู้ใช้ใหม่ → ต้องมี passcode
    if (!editingUser) {
      if (!formData.passcode.trim()) {
        alert('กรุณากรอกรหัสผ่านสำหรับผู้ใช้ใหม่');
        return;
      }
      payload.passcode = formData.passcode.trim();
    }

    // ถ้าแก้ไขและกรอกรหัสผ่านใหม่ → ส่ง passcode
    if (editingUser && formData.new_passcode.trim()) {
      payload.passcode = formData.new_passcode.trim();
    }

    const url = editingUser ? `/users/${editingUser.user_id}` : '/users';
    const method = editingUser ? axios.put : axios.post;

    method(url, payload)
      .then(res => {
        alert(res.data.message || (editingUser ? 'แก้ไขผู้ใช้สำเร็จ' : 'เพิ่มผู้ใช้สำเร็จ'));
        setShowForm(false);
        setEditingUser(null);
        setFormData({ room_number: '', phone: '', passcode: '', new_passcode: '', fullname: '', note: '', active: 1 });
        fetchUsers();
      })
      .catch(err => {
        alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
      });
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      room_number: user.room_number || '',
      phone: user.phone || '',
      passcode: '',
      new_passcode: '',
      fullname: user.fullname || '',
      note: user.note || '',
      active: user.active
    });
    setShowForm(true);
  };

  const handleDelete = (user) => {
    const userName = user.fullname || user.phone || `ID ${user.user_id}`;
    
    if (!window.confirm(`ยืนยันการลบผู้ใช้ "${userName}" หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้!`)) {
      return;
    }

    axios.delete(`/users/${user.user_id}`)
      .then(res => {
        alert(res.data.message || 'ลบผู้ใช้สำเร็จ');
        fetchUsers();
      })
      .catch(err => {
        alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้');
      });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ room_number: '', phone: '', passcode: '', new_passcode: '', fullname: '', note: '', active: 1 });
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2 style={{margin: '2rem 0 1rem 0', color: '#2c3e50', fontSize: '2rem'}}>จัดการผู้ใช้</h2>
        
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)} 
          style={{
            marginBottom: '2rem', 
            fontSize: '1.2rem', 
            padding: '0.9rem 2rem', 
            fontWeight: '600'
          }}
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
            <h4 style={{marginBottom: '1.5rem', color: '#2c3e50', fontSize: '1.6rem'}}>
              {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
            </h4>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label style={{fontWeight: '600'}}>ห้อง</label>
                <input 
                  type="text" 
                  value={formData.room_number} 
                  onChange={e => setFormData({...formData, room_number: e.target.value.trim()})} 
                  required 
                  placeholder="เช่น 101"
                />
              </div>
              <div className="form-group">
                <label style={{fontWeight: '600'}}>เบอร์โทร</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value.trim()})} 
                  required 
                  placeholder="เช่น 0863841265"
                />
              </div>

              {/* รหัสผ่านสำหรับผู้ใช้ใหม่ (บังคับ) */}
              {!editingUser && (
                <div className="form-group">
                  <label style={{fontWeight: '600'}}>รหัสผ่าน (Passcode)</label>
                  <input 
                    type="password" 
                    value={formData.passcode} 
                    onChange={e => setFormData({...formData, passcode: e.target.value.trim()})} 
                    required 
                    placeholder="เช่น 1234"
                  />
                </div>
              )}

              {/* เปลี่ยนรหัสผ่านสำหรับแก้ไข (ไม่บังคับ) */}
              {editingUser && (
                <div className="form-group">
                  <label style={{fontWeight: '600'}}>เปลี่ยนรหัสผ่านใหม่ (ถ้าต้องการ)</label>
                  <input 
                    type="password" 
                    value={formData.new_passcode} 
                    onChange={e => setFormData({...formData, new_passcode: e.target.value.trim()})} 
                    placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
                  />
                  <small style={{color: '#7f8c8d', fontStyle: 'italic', display: 'block', marginTop: '0.5rem'}}>
                    ถ้าไม่กรอก จะคงรหัสผ่านเดิมไว้
                  </small>
                </div>
              )}

              <div className="form-group">
                <label style={{fontWeight: '600'}}>ชื่อ-นามสกุล</label>
                <input 
                  type="text" 
                  value={formData.fullname} 
                  onChange={e => setFormData({...formData, fullname: e.target.value.trim()})} 
                  placeholder="เช่น นายทดสอบ หนึ่ง"
                />
              </div>

              <div className="form-group">
                <label style={{fontWeight: '600'}}>โน๊ต</label>
                <textarea 
                  value={formData.note} 
                  onChange={e => setFormData({...formData, note: e.target.value.trim()})} 
                  rows="3" 
                  placeholder="ข้อมูลเพิ่มเติม..."
                />
              </div>

              <div className="form-group">
                <label style={{display: 'flex', alignItems: 'center', fontWeight: '600'}}>
                  <input 
                    type="checkbox" 
                    checked={formData.active} 
                    onChange={e => setFormData({...formData, active: e.target.checked ? 1 : 0})}
                    style={{marginRight: '0.8rem', width: '20px', height: '20px'}}
                  />
                  เปิดใช้งานผู้ใช้นี้
                </label>
              </div>

              <div style={{marginTop: '2.5rem', textAlign: 'center'}}>
                <button type="submit" className="btn btn-primary" style={{padding: '1rem 2.5rem', fontSize: '1.2rem'}}>
                  {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
                </button>
                <button 
                  type="button" 
                  onClick={cancelForm} 
                  style={{
                    marginLeft: '1rem', 
                    padding: '1rem 2.5rem', 
                    backgroundColor: '#95a5a6', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.2rem',
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
                <td><strong>{user.user_id}</strong></td>
                <td>{user.room_number || '-'}</td>
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
                    style={{padding: '0.7rem 1.5rem', marginRight: '0.8rem', fontSize: '1rem'}}
                  >
                    แก้ไข
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(user)}
                    style={{padding: '0.7rem 1.5rem', fontSize: '1rem'}}
                  >
                    ลบ
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