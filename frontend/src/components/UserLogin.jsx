import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserLogin() {
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ตัดช่องว่างทั้งเบอร์และรหัสผ่านก่อนส่ง (สำคัญมาก!)
    const trimmedPhone = phone.trim();
    const trimmedPasscode = passcode.trim();

    if (!trimmedPhone || !trimmedPasscode) {
      setError('กรุณากรอกเบอร์โทรและรหัสผ่าน');
      setLoading(false);
      return;
    }

    try {
      // URL เป็น /user/login (baseURL มี /api อยู่แล้ว)
      const res = await axios.post('/user/login', { 
        phone: trimmedPhone, 
        passcode: trimmedPasscode 
      });

      if (res.data.success) {
        // บันทึกข้อมูลผู้ใช้
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // แจ้งสำเร็จ
        alert(`เข้าสู่ระบบสำเร็จ!\nยินดีต้อนรับคุณ ${res.data.user.fullname || 'ผู้ใช้'}`);
        
        // ไปหน้า Dashboard ผู้ใช้ (บังคับโหลดใหม่เพื่อความแน่นอน)
        window.location.href = '/user/dashboard';
      } else {
        setError(res.data.message || 'เข้าสู่ระบบล้มเหลว');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ หรือข้อมูลไม่ถูกต้อง';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h3>เข้าสู่ระบบผู้ใช้ตู้เก็บของ</h3>
        <p style={{textAlign:'center', color:'#777', marginBottom:'2rem', fontSize:'1.1rem'}}>
          กรุณากรอกเบอร์โทรและรหัสผ่านเพื่อใช้งานตู้
        </p>

        {error && (
          <div className="alert alert-danger" style={{padding: '1rem', borderRadius: '8px'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{fontWeight:'600'}}>เบอร์โทรศัพท์</label>
            <input
              type="text"
              placeholder="เช่น 0863841265"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
              style={{padding: '1rem', fontSize: '1.1rem', borderRadius: '8px'}}
            />
          </div>

          <div className="form-group">
            <label style={{fontWeight:'600'}}>รหัสผ่าน (Passcode)</label>
            <input
              type="password"
              placeholder="เช่น 1234"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
              disabled={loading}
              style={{padding: '1rem', fontSize: '1.1rem', borderRadius: '8px'}}
            />
          </div>

          <button
            type="submit"
            className="btn btn-loginuser"
            disabled={loading}
            style={{
              width: '50%', 
              padding: '1.2rem', 
              fontSize: '1.3rem', 
              fontWeight: '600',
              marginTop: '1rem',
              borderRadius: '12px'
            }}
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '10px'}}>
          <p style={{textAlign:'center', color:'#495057', fontSize:'1rem', marginBottom: '0.8rem'}}>
            <strong>ข้อมูลสำหรับทดสอบ</strong>
          </p>
          <p style={{textAlign:'center', color:'#6c757d', fontSize:'0.95rem', lineHeight: '1.6'}}>
            เบอร์: 0863841265 / รหัส: 1234<br/>
            เบอร์: 0812345678 / รหัส: 5678<br/>
            หรือผู้ใช้ที่ Admin เพิ่มใหม่ทั้งหมด
          </p>
        </div>

        <p style={{textAlign:'center', marginTop:'2rem', color:'#777'}}>
          ลืมรหัสผ่านหรือมีปัญหา?<br/>
          <strong>ติดต่อ Admin</strong>
        </p>
      </div>
    </div>
  );
}