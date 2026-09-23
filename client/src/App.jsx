import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import MarkAttendancePage from './pages/MarkAttendancePage';
import ManageStudentsPage from './pages/ManageStudentsPage';
import TeamSummaryPage from './pages/TeamSummaryPage';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mark-attendance"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MarkAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team-summary"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TeamSummaryPage />
            </ProtectedRoute>
          }
        />

        {/* Student Protected Routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
