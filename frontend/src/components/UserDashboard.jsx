import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const [data, setData] = useState({
    user: null,
    current_lockers: [],
    available_lockers: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.user_id) {
      navigate('/user-login');
      return;
    }

    axios.get(`/user/dashboard?user_id=${user.user_id}`)
      .then(res => setData(res.data))
      .catch(err => {
        console.error('โหลดข้อมูลล้มเหลว:', err);
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

  const handleWithdraw = (locker_id) => {
    if (!window.confirm(`ยืนยันถอนของจากตู้หมายเลข ${locker_id} หรือไม่?`)) {
      return;
    }

    axios.post('/user/withdraw', { user_id: user.user_id, locker_id })
      .then(res => {
        alert(res.data.message || 'ถอนของสำเร็จ');
        window.location.reload();
      })
      .catch(err => alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการถอนของ'));
  };

  // เพิ่มฟังก์ชันสลับสถานะใช้งาน
  const handleToggleActive = () => {
  const newStatus = data.user.active ? 0 : 1;
  const statusText = newStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน';

  if (!window.confirm(`ยืนยัน${statusText}บัญชีของคุณหรือไม่?\n\n${newStatus ? 'คุณจะสามารถใช้งานระบบได้ตามปกติ' : 'คุณจะไม่สามารถฝาก/ถอนของได้จนกว่าจะเปิดใช้งานอีกครั้ง'}`)) {
    return;
  }

  axios.put('/user/profile', { 
    user_id: user.user_id, 
    active: newStatus 
  })
    .then(res => {
      alert(res.data.message || `${statusText}บัญชีสำเร็จ`);
      // อัปเดตข้อมูลใน state และ localStorage
      const updatedUser = { ...user, active: newStatus };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setData({ ...data, user: { ...data.user, active: newStatus } });
    })
    .catch(err => {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    });
};
  const handleLogout = () => {
    localStorage.removeItem('user');
    alert('ออกจากระบบสำเร็จ');
    navigate('/user-login');
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
      {/* ปุ่มฝากของเพิ่ม, สลับสถานะ, ออกจากระบบ */}
      <div style={{textAlign:'right', marginBottom:'1.5rem'}}>
        <button 
          onClick={handleDeposit} 
          className="btn btn-primary btn-deposit-add"
          style={{marginRight: '1rem'}}
        >
          + ฝากของเพิ่ม
        </button>

        {/* ปุ่มสลับสถานะใช้งาน */}
        <button 
          onClick={handleToggleActive}
          className={`btn ${data.user?.active ? 'btn-warning' : 'btn-success'}`}
          style={{marginRight: '1rem', padding: '0.8rem 1.5rem'}}
        >
          {data.user?.active ? 'ปิดใช้งานบัญชี' : 'เปิดใช้งานบัญชี'}
        </button>

        <button onClick={handleLogout} className="btn-logout">
          ออกจากระบบ
        </button>
      </div>

      <div className="user-dashboard-card">
        <h2>สวัสดี {data.user?.fullname || 'ผู้ใช้'}</h2>
        <p style={{fontSize: '1.2rem', color: '#555'}}>
          ห้อง: {data.user?.room_number || '-'} | เบอร์: {data.user?.phone}
        </p>

        {/* แสดงสถานะบัญชีเด่น ๆ */}
        <div style={{
          textAlign: 'center',
          margin: '1.5rem 0',
          padding: '1rem',
          background: data.user?.active ? '#d4edda' : '#f8d7da',
          borderRadius: '12px',
          border: `2px solid ${data.user?.active ? '#28a745' : '#dc3545'}`
        }}>
          <h4 style={{color: data.user?.active ? '#155724' : '#721c24', margin: 0}}>
            สถานะบัญชี: {data.user?.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </h4>
        </div>

        <div className="user-stat-card">
          <h5>ตู้ว่างทั้งหมดในระบบ</h5>
          <h2>{data.available_lockers || 0}</h2>
        </div>

        {/* แสดงตู้ที่กำลังใช้งาน */}
        {data.current_lockers && data.current_lockers.length > 0 ? (
          <div className="current-lockers-section">
            <h3 style={{color: '#27ae60', marginBottom: '1.5rem'}}>
              ตู้ที่คุณกำลังใช้งาน ({data.current_lockers.length} ตู้)
            </h3>
            <div className="lockers-grid">
              {data.current_lockers.map(locker => (
                <div key={locker.locker_id} className="locker-card">
                  <h2 style={{fontSize: '3.5rem', color: '#27ae60', margin: '0.5rem 0'}}>
                    #{locker.locker_id}
                  </h2>
                  <p style={{color: '#555', marginBottom: '1rem'}}>
                    ฝากเมื่อ: {locker.deposit_time || '-'}
                  </p>
                  <button 
                    onClick={() => handleWithdraw(locker.locker_id)}
                    className="user-big-btn btn-withdraw"
                  >
                    ถอนของจากตู้นี้
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-locker-box">
            <h3 style={{color: '#7f8c8d'}}>คุณยังไม่ได้ฝากของ</h3>
            <p style={{color: '#95a5a6', margin: '1rem 0'}}>
              กดปุ่ม "ฝากของเพิ่ม" ด้านบนเพื่อเริ่มใช้งาน
            </p>
          </div>
        )}
      </div>
    </div>
  );
}