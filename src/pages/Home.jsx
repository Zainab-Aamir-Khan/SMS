import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
        Welcome to Student Management System
      </h1>
      <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 30px' }}>
        A unified platform for Admins, Teachers, and Students to streamline education, track performance, and manage academics efficiently.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link to="/login" className="btn" style={{ padding: '12px 28px', fontSize: '1rem' }}>
          Access Portal
        </Link>
        <Link to="/signup" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
          Create Account
        </Link>
      </div>

      <div className="actions-grid" style={{ marginTop: '60px', textAlign: 'left' }}>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h3>👑 Admin Suite</h3>
          <p>Full control over users, classes, roles, and global system parameters.</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h3>👨‍🏫 Teacher Hub</h3>
          <p>Record daily class attendance, assign homework, and submit exam grades.</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h3>🎓 Student Corner</h3>
          <p>Check class schedules, track overall GPA, and download report cards.</p>
        </div>
      </div>
    </div>
  );
}