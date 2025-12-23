import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// นำเข้าทุกหน้าที่ต้องการ animation
import Dashboard from './components/Dashboard';
import Lockers from './components/Lockers';
import Users from './components/Users';
import UserLogin from './components/UserLogin';
import UserDashboard from './components/UserDashboard';
import Login from './components/Login'; // หน้า Admin Login

const pageVariants = {
  initial: { opacity: 0, x: -100 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 100 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        style={{ width: '100%' }}
      >
        <Routes location={location} key={location.pathname}>
          {/* Admin Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/lockers" element={<Lockers />} />
          <Route path="/users" element={<Users />} />

          {/* User Routes */}
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}