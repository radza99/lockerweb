import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import DateTimeDisplay from './DateTimeDisplay'

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);  // เพิ่ม loading state
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/admin/dashboard')
      .then(res => {
        setStats(res.data);
      })
      .catch(err => {
        console.error('โหลด Dashboard ล้มเหลว:', err);
        // ถ้า error 401 หรืออื่น ๆ ที่เกี่ยวกับ login → เด้งไป login
        navigate('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>ภาพรวมระบบ</h2>
        <div className="stats-grid">
          <div className="stat-card bg-primary">
            <h5>ตู้ทั้งหมด</h5>
            <h2>{stats.total_lockers || 0}</h2>
          </div>
          <div className="stat-card bg-success">
            <h5>ตู้ว่าง</h5>
            <h2>{stats.available || 0}</h2>
          </div>
          <div className="stat-card bg-warning">
            <h5>ตู้ใช้งานอยู่</h5>
            <h2>{stats.occupied || 0}</h2>
          </div>
          <div className="stat-card bg-info">
            <h5>ผู้ใช้ทั้งหมด</h5>
            <h2>{stats.total_users || 0}</h2>
          </div>
        </div>
    <DateTimeDisplay />
      </div>
    </>
  );
}