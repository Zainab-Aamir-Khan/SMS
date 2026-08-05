import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const safeRole = role === 'admin' ? 'student' : role;
      await signup({ name, email, password, role: safeRole });

      if (safeRole === 'teacher') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    }
  };

  return (
    <div className="auth-card">
      <h2>Create an Account</h2>
      <p style={{ fontSize: '0.875rem' }}>Register as a Student or Teacher.</p>
      
      {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@sms.com"
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="form-group">
          <label>Register As</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px' }}>
          Sign Up
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
}