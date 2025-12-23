import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullname: '',
    note: '',
    current_passcode: '',
    new_passcode: '',
    confirm_passcode: ''
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.user_id) {
      navigate('/user-login');
      return;
    }

    axios.get(`/user/dashboard?user_id=${user.user_id}`)
      .then(res => setData(res.data))
      .catch(() => {
        alert('ไม่สามารถโหลดข้อมูลได้ กรุณาเข้าสู่ระบบใหม่');
        navigate('/user-login');
      })
      .finally(() => setLoading(false));
  }, [navigate, user.user_id]);

  const handleDeposit = () => {
    axios.post('/user/deposit', { user_id: user.user_id })
      .then(res => {
        alert(res.data.message || 'ฝากของสำเร็จ');
        window.location.reload();
      })
      .catch(err => alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการฝากของ'));
  };

  const handleWithdraw = () => {
    axios.post('/user/withdraw', { user_id: user.user_id })
      .then(res => {
        alert(res.data.message || 'ถอนของสำเร็จ');
        window.location.reload();
      })
      .catch(err => alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการถอนของ'));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    alert('ออกจากระบบสำเร็จ');
    navigate('/user-login');
  };

  // เปิดฟอร์มแก้ไขข้อมูล
  const openEditForm = () => {
    setEditFormData({
      fullname: data.user?.fullname || '',
      note: data.user?.note || '',
      current_passcode: '',
      new_passcode: '',
      confirm_passcode: ''
    });
    setShowEditForm(true);
  };

  // บันทึกการแก้ไขข้อมูลส่วนตัว
  const handleEditSubmit = (e) => {
    e.preventDefault();

    if (editFormData.new_passcode && editFormData.new_passcode !== editFormData.confirm_passcode) {
      alert('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (editFormData.new_passcode && !editFormData.current_passcode) {
      alert('กรุณากรอกรหัสผ่านปัจจุบันเพื่อเปลี่ยนรหัสผ่านใหม่');
      return;
    }

    let payload = {
      fullname: editFormData.fullname.trim(),
      note: editFormData.note.trim()
    };

    if (editFormData.new_passcode) {
      payload.passcode = editFormData.new_passcode.trim();
    }

    axios.put(`/users/${user.user_id}`, payload)
      .then(res => {
        alert(res.data.message || 'แก้ไขข้อมูลสำเร็จ');
        setShowEditForm(false);
        // อัปเดตข้อมูลใน localStorage และรีเฟรชหน้า
        const updatedUser = { ...user, fullname: payload.fullname };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload();
      })
      .catch(err => {
        alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      });
  };

  if (loading) {
    return (
      <div className="container" style={{textAlign:'center', padding:'4rem'}}>
        <h3>กำลังโหลดข้อมูล...</h3>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      <div style={{textAlign:'right', marginBottom:'1rem'}}>
        <button onClick={openEditForm} className="btn btn-primary" style={{marginRight: '1rem'}}>
          แก้ไขข้อมูลส่วนตัว
        </button>
        <button onClick={handleLogout} className="btn-logout">ออกจากระบบ</button>
      </div>

      <div className="user-dashboard-card">
        <h2>สวัสดี {data.user?.fullname || 'ผู้ใช้'}</h2>
        <p style={{fontSize: '1.2rem', color: '#555'}}>
          ห้อง: {data.user?.room_number} | เบอร์: {data.user?.phone}
        </p>

        <div className="user-stat-card">
          <h5>ตู้ว่างทั้งหมดในระบบ</h5>
          <h2>{data.available_lockers || 0}</h2>
        </div>

        {data.current_locker ? (
          <div className="current-locker-box">
            <h3>คุณกำลังใช้งานตู้</h3>
            <h1>#{data.current_locker.locker_id}</h1>
            <p>ฝากเมื่อ: {data.current_locker.deposit_time || '-'}</p>
            <button onClick={handleWithdraw} className="user-big-btn btn-withdraw">
              ถอนของจากตู้
            </button>
          </div>
        ) : (
          <div className="no-locker-box">
            <h3>คุณยังไม่ได้ฝากของ</h3>
            <p>กดปุ่มเพื่อฝากของอัตโนมัติ</p>
            <button onClick={handleDeposit} className="user-big-btn btn-deposit">
              ฝากของ
            </button>
          </div>
        )}
      </div>

      {/* ฟอร์มแก้ไขข้อมูลส่วนตัว */}
      {showEditForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2.5rem',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{marginBottom: '1.5rem', color: '#2c3e50', textAlign: 'center'}}>
              แก้ไขข้อมูลส่วนตัว
            </h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={editFormData.fullname}
                  onChange={e => setEditFormData({...editFormData, fullname: e.target.value})}
                  placeholder="เช่น นายทดสอบ หนึ่ง"
                />
              </div>

              <div className="form-group">
                <label>โน๊ต</label>
                <textarea
                  value={editFormData.note}
                  onChange={e => setEditFormData({...editFormData, note: e.target.value})}
                  rows="3"
                  placeholder="ข้อมูลเพิ่มเติม..."
                />
              </div>

              <div style={{margin: '1.5rem 0', padding: '1rem', background: '#f8f9fa', borderRadius: '10px'}}>
                <p style={{fontWeight: '600', color: '#2c3e50', marginBottom: '1rem'}}>
                  เปลี่ยนรหัสผ่าน (ถ้าต้องการ)
                </p>
                <div className="form-group">
                  <label>รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={editFormData.new_passcode}
                    onChange={e => setEditFormData({...editFormData, new_passcode: e.target.value})}
                    placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
                  />
                </div>
                {editFormData.new_passcode && (
                  <div className="form-group">
                    <label>ยืนยันรหัสผ่านใหม่</label>
                    <input
                      type="password"
                      value={editFormData.confirm_passcode}
                      onChange={e => setEditFormData({...editFormData, confirm_passcode: e.target.value})}
                      required
                    />
                  </div>
                )}
              </div>

              <div style={{textAlign: 'center', marginTop: '2rem'}}>
                <button type="submit" className="btn btn-primary" style={{padding: '1rem 2.5rem', fontSize: '1.2rem'}}>
                  บันทึกการแก้ไข
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditForm(false)}
                  style={{
                    marginLeft: '1rem',
                    padding: '1rem 2.5rem',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.2rem'
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}