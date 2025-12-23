import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

// Interceptor จับ 401 (ยกเว้นตอน login และ check)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // ยกเว้นไม่เด้งไป login ถ้าเป็น request check หรือ login เอง
    if (error.config?.url.includes('/admin/check') || error.config?.url.includes('/admin/login')) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await axios.get('/admin/check');
      setIsAuthenticated(res.data.authenticated === true);
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axios.post('/admin/login', { username, password });
      if (res.data.success) {
        setIsAuthenticated(true);  // ตั้งทันทีหลัง login สำเร็จ
        await checkAuth();         // เช็คซ้ำเพื่อยืนยัน session จาก backend
        return { success: true };
      }
    } catch (err) {
      setIsAuthenticated(false);
      return { success: false, message: err.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
    return { success: false, message: 'เข้าสู่ระบบล้มเหลว' };
  };

  const logout = async () => {
    try {
      await axios.post('/admin/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      window.location.href = '/login';  // บังคับไปหน้า login
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);