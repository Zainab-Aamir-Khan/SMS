import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      <p>System configuration & user access management.</p>
      
      <div className="actions-grid">
        <Link to="/admin/manage-users" className="btn">
          Manage Users
        </Link>
        <Link to="/admin/settings" className="btn btn-secondary">
          System Settings
        </Link>
      </div>
    </div>
  );
}