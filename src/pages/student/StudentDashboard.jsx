import React from 'react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Student Dashboard</h1>
      <p>Welcome to your learning portal.</p>
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <Link to="/student/grades" style={{ padding: '10px 15px', background: '#ffc107', color: '#000', textDecoration: 'none', borderRadius: '4px' }}>
          View Grades
        </Link>
        <Link to="/student/schedule" style={{ padding: '10px 15px', background: '#6f42c1', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
          Class Schedule
        </Link>
      </div>
    </div>
  );
}