import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="brand">
        🎓 SMS Portal <span className="role-badge">{user.role}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span>Welcome, <strong>{user.name}</strong></span>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}