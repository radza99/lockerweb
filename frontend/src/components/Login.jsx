import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

 // ... (โค้ดเดิม)
return (
  <div className="login-container">
    <div className="login-card">
      <h3>Admin Login</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ชื่อผู้ใช้</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} />
        </div>
        <div className="form-group">
          <label>รหัสผ่าน</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
        </div>
        <button type="submit" className="btn btn-loginadmin" style={{width:'50%'}} disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
  <p style={{ color: '#666', marginBottom: '1rem' }}>
    คุณเป็นผู้ใช้ตู้เก็บของหรือไม่?
  </p>
  <a 
    href="/user-login"
    style={{
      display: 'inline-block',
      padding: '1rem 2.5rem',
      marginTop: '-0.2rem',  
      background: 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '16px',
      fontSize: '1.2rem',
      fontWeight: '60',
      boxShadow: '0 8px 25px rgba(27, 88, 76, 0.3)'
    }}
  >
    เข้าสู่ระบบสำหรับผู้ใช้
  </a>
</div>  
      </form>
      <p style={{textAlign:'center', marginTop:'1rem', color:'#777'}}>ทดสอบ: admin / admin123</p>
      
    </div>
    
  </div>
  
);
 
}