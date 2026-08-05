import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
        🎓 SMS Portal
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>
          Home
        </Link>

        {user ? (
          <>
            <span className="role-badge">{user.role}</span>
            <span>Welcome, <strong>{user.name}</strong></span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn" style={{ padding: '6px 16px', background: '#38bdf8', color: '#0f172a' }}>
            Portal
          </Link>
        )}
      </div>
    </nav>
  );
}