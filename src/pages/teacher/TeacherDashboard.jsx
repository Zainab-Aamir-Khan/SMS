import React from 'react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Teacher Dashboard</h1>
      <p>Manage your classes, record attendance, and input grades.</p>
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <Link to="/teacher/attendance" style={{ padding: '10px 15px', background: '#28a745', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
          Class Attendance
        </Link>
        <Link to="/teacher/grades" style={{ padding: '10px 15px', background: '#17a2b8', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
          Manage Grades
        </Link>
      </div>
    </div>
  );
}