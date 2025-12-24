import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          Safe Locker Admin 
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/lockers">จัดการตู้</Link>
        <Link to="/users">จัดการผู้ใช้</Link>  {/* เพิ่มบรรทัดนี้ */}
        <button onClick={handleLogout}>ออกจากระบบ</button>
      </div>
    </nav>
  );
}