import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.user_id) {
      navigate('/user-login');
      return;
    }

    // แก้ตรงนี้: ตัด /api ออก เพราะ baseURL มี /api อยู่แล้ว (เหมือน UserLogin)
    axios.get(`/user/dashboard?user_id=${user.user_id}`)
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        console.error('โหลดข้อมูลล้มเหลว:', err);
        alert('ไม่สามารถโหลดข้อมูลได้ กรุณาเข้าสู่ระบบใหม่');
        navigate('/user-login');
      })
      .finally(() => setLoading(false));
  }, [navigate, user.user_id]);  // เพิ่ม user.user_id เพื่อรีโหลดถ้า user เปลี่ยน

  const handleDeposit = () => {
    // แก้เป็น /user/deposit
    axios.post('/user/deposit', { user_id: user.user_id })
      .then(res => {
        alert(res.data.message || 'ฝากของสำเร็จ');
        window.location.reload();  // รีเฟรชเพื่ออัปเดตข้อมูล
      })
      .catch(err => {
        alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการฝากของ');
      });
  };

  const handleWithdraw = () => {
    // แก้เป็น /user/withdraw
    axios.post('/user/withdraw', { user_id: user.user_id })
      .then(res => {
        alert(res.data.message || 'ถอนของสำเร็จ');
        window.location.reload();
      })
      .catch(err => {
        alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการถอนของ');
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
    <div style={{textAlign:'right', marginBottom:'1.5rem'}}>
      <button onClick={handleLogout} className="btn-logout">ออกจากระบบ</button>
    </div>

    <div className="user-dashboard-card">
      <h2>สวัสดี {data.user?.fullname || 'ผู้ใช้'}</h2>
      <p>ห้อง: {data.user?.room_number} | เบอร์: {data.user?.phone}</p>

      <div className="user-stat-card">
        <h5>ตู้ว่างทั้งหมดในระบบ</h5>
        <h2>{data.available_lockers || 0}</h2>
      </div>

      {data.current_locker ? (
        <div className="current-locker-box">
          <h3>คุณกำลังใช้งานตู้</h3>
          <h1>#{data.current_locker.locker_id}</h1>
          <p>ฝากเมื่อ: {data.current_locker.deposit_time || '-'}</p>
          <button 
            onClick={handleWithdraw} 
            className="user-big-btn btn-withdraw"
          >
            ถอนของจากตู้
          </button>
        </div>
      ) : (
        <div className="no-locker-box">
          <h3>คุณยังไม่ได้ฝากของ</h3>
          <p>กดปุ่มเพื่อฝากของอัตโนมัติ</p>
          <button 
            onClick={handleDeposit} 
            className="user-big-btn btn-deposit"
          >
            ฝากของ
          </button>
        </div>
      )}
    </div>
  </div>
);

}