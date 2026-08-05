import React from 'react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  return (
    <div className="page-container">
      <h1>Teacher Dashboard</h1>
      <p>Manage your classes, record attendance, and input student grades.</p>
      
      <div className="actions-grid">
        <Link to="/teacher/attendance" className="btn">
          Class Attendance
        </Link>
        <Link to="/teacher/grades" className="btn btn-secondary">
          Manage Grades
        </Link>
      </div>
    </div>
  );
}