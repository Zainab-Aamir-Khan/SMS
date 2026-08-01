import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome to the Admin Portal. Select an action below:</p>
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <Link to="/admin/manage-users" style={{ padding: '10px 15px', background: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
          Manage Users
        </Link>
        <Link to="/admin/settings" style={{ padding: '10px 15px', background: '#6c757d', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
          System Settings
        </Link>
      </div>
    </div>
  );
}