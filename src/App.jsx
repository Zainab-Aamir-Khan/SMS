import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Base Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';

// Role Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import SystemSettings from './pages/admin/SystemSettings';
import ClassesSubjects from './pages/admin/ClassesSubjects';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ClassAttendance from './pages/teacher/ClassAttendance';
import ManageGrades from './pages/teacher/ManageGrades';

import StudentDashboard from './pages/student/StudentDashboard';
import ViewGrades from './pages/student/ViewGrades';
import Schedule from './pages/student/Schedule';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/manage-users" element={<ManageUsers />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
            <Route path="/admin/classes-subjects" element={<ClassesSubjects />} />  
          </Route>

          {/* Protected Teacher Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/attendance" element={<ClassAttendance />} />
            <Route path="/teacher/grades" element={<ManageGrades />} />
          </Route>

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/grades" element={<ViewGrades />} />
            <Route path="/student/schedule" element={<Schedule />} />
          </Route>

          {/* Default Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;