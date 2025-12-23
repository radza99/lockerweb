import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

export default function Lockers() {
  const [lockers, setLockers] = useState([]);
  const navigate = useNavigate();

  const fetchLockers = () => {
    axios.get('/lockers')
      .then(res => setLockers(res.data))
      .catch(() => navigate('/login'));
  };

  useEffect(() => {
    fetchLockers();
  }, [navigate]);

  const forceOpen = (lockerId) => {
    if (!window.confirm('ยืนยันการเปิดตู้ด้วยมือ (Force Open)?\nการกระทำนี้จะรีเซ็ตตู้และบันทึก log')) return;

    axios.post(`/lockers/${lockerId}/force-open`)
      .then(res => {
        alert(res.data.message || 'เปิดตู้สำเร็จ');
        fetchLockers(); // รีเฟรชข้อมูลตู้ใหม่
      })
      .catch(() => alert('เกิดข้อผิดพลาดในการเปิดตู้'));
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>รายการตู้เก็บของ</h2>
        <table className="table">
          <thead>
            <tr>
              <th>หมายเลขตู้</th>
              <th>สถานะ</th>
              <th>เบอร์เจ้าของ</th>
              <th>ชื่อ-นามสกุล</th>
              <th>ห้อง</th>
              <th>เวลาฝาก</th>
              <th style={{ textAlign: 'center' }}>การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {lockers.map(locker => (
              <tr key={locker.locker_id}>
                <td><strong>#{locker.locker_id}</strong></td>
                <td>
                  {locker.status === 1 ? (
                    <span className="badge badge-danger">ใช้งานอยู่</span>
                  ) : (
                    <span className="badge badge-success">ว่าง</span>
                  )}
                </td>
                <td>{locker.phone_owner || '-'}</td>
                <td>{locker.fullname || '-'}</td>
                <td>{locker.room_number || '-'}</td>
                <td>{locker.deposit_time || '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  {locker.status === 1 && (
                    <button
                      className="btn btn-warning"
                      onClick={() => forceOpen(locker.locker_id)}
                    >
                      Openlocker
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}