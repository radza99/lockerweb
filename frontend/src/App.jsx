import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Lockers from './components/Lockers';
import Users from './components/Users'; 
import UserDashboard from './components/UserDashboard'; 
import UserLogin from './components/UserLogin';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f6f9',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        <h3 style={{ color: '#555' }}>กำลังโหลด...</h3>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/lockers" element={<ProtectedRoute><Lockers /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />  {/* เพิ่มบรรทัดนี้ */}
      <Route path="/user-login" element={<UserLogin />} />
      <Route path="/user/dashboard" element={<UserDashboard />} />
       
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}