import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import DateTimeDisplay from './DateTimeDisplay';
import * as XLSX from 'xlsx';  // สำหรับ export Excel

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(err => {
        console.error('โหลด Dashboard ล้มเหลว:', err);
        navigate('/login');
      });

    axios.get('/admin/transactions')
      .then(res => setTransactions(res.data))
      .catch(err => {
        console.error('โหลดประวัติล้มเหลว:', err);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const getActionText = (action) => {
    switch (action) {
      case 'deposit':
        return { text: 'ฝากของ', color: '#27ae60' };
      case 'withdraw':
        return { text: 'ถอนของ', color: '#e67e22' };
      case 'admin_force_open':
        return { text: 'Admin เปิดตู้', color: '#e74c3c' };
      default:
        return { text: action, color: '#95a5a6' };
    }
  };

  const formatGMTDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toUTCString();
  };

  // Export เป็นไฟล์ TXT
  const exportToTXT = () => {
    let txtContent = "ประวัติการใช้งานระบบตู้เก็บของ\n";
    txtContent += "=======================================\n\n";
    txtContent += `วันที่ export: ${new Date().toLocaleString('th-TH')}\n\n`;

    transactions.forEach(log => {
      const action = getActionText(log.action);
      txtContent += `${formatGMTDateTime(log.timestamp)}\n`;
      txtContent += `${action.text} ตู้ #${log.locker_id}`;
      if (log.fullname) txtContent += ` โดย ${log.fullname} (${log.phone})`;
      if (log.detail) txtContent += ` - ${log.detail}`;
      txtContent += "\n\n";
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ประวัติการใช้งาน_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export เป็นไฟล์ Excel (.xlsx)
  const exportToExcel = () => {
    const worksheetData = transactions.map(log => {
      const action = getActionText(log.action);
      return {
        'เวลา (GMT)': formatGMTDateTime(log.timestamp),
        'การกระทำ': action.text,
        'ตู้หมายเลข': log.locker_id,
        'ผู้ใช้': log.fullname || '-',
        'เบอร์โทร': log.phone || '-',
        'รายละเอียด': log.detail || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ประวัติการใช้งาน");

    // ตั้งชื่อไฟล์
    XLSX.writeFile(workbook, `ประวัติการใช้งาน_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="container" style={{textAlign:'center', padding:'6rem'}}>
        <h3>กำลังโหลดข้อมูล...</h3>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h2 style={{margin: '2rem 0 1rem 0', color: '#2c3e50', fontSize: '2rem'}}>ภาพรวมระบบ</h2>

        {/* สถิติหลัก */}
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

        {/* ปุ่ม Export */}
       {/* ปุ่ม Export - แยก CSS ออกมาเป็น class */}
<div className="export-buttons-container">
  <button onClick={exportToTXT} className="btn-export btn-export-txt">
    📄 Export เป็น TXT
  </button>
  <button onClick={exportToExcel} className="btn-export btn-export-excel">
    📊 Export เป็น Excel
  </button>
</div>
        {/* ประวัติการใช้งาน */}
        <div>
          <h3 style={{color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.8rem'}}>
            ประวัติการใช้งานล่าสุด
          </h3>

          {transactions.length > 0 ? (
            <div className="transactions-log">
              {transactions.map((log, index) => {
                const action = getActionText(log.action);
                return (
                  <div key={index} className="transaction-item">
                    <div className="transaction-time">
                      {formatGMTDateTime(log.timestamp)}
                    </div>
                    <div className="transaction-detail">
                      <span style={{color: action.color, fontWeight: '600'}}>
                        {action.text}
                      </span>
                      {' '}ตู้ #{log.locker_id}
                      {log.fullname && ` โดย ${log.fullname} (${log.phone})`}
                      {log.detail && ` - ${log.detail}`}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{color: '#95a5a6', fontStyle: 'italic', textAlign: 'center', padding: '2rem'}}>
              ยังไม่มีประวัติการใช้งาน
            </p>
          )}
        </div>
      </div>
    </>
  );
}