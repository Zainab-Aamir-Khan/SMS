import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1 style={{ color: 'red' }}>403 - Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/login">Return to Login</Link>
    </div>
  );
}