import React, { useState, useEffect } from 'react';

export default function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // อัปเดตทุกวินาที

    return () => clearInterval(timer); // ล้างเมื่อ component ถูกถอน
  }, []);

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('th-TH', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="dashboard-datetime">
      <div className="dashboard-date">
        {formatDate(currentTime)}
      </div>
      <div className="dashboard-time">
        {formatTime(currentTime)}
      </div>
    </div>
  );
}