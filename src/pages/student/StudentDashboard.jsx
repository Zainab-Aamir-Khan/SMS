import React from 'react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  return (
    <div className="page-container">
      <h1>Student Dashboard</h1>
      <p>Welcome to your academic learning portal.</p>
      
      <div className="actions-grid">
        <Link to="/student/grades" className="btn">
          View Grades
        </Link>
        <Link to="/student/schedule" className="btn btn-secondary">
          Class Schedule
        </Link>
      </div>
    </div>
  );
}