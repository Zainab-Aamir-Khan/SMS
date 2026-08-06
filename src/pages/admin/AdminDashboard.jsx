import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeAdminStats } from '../../services/dashboardService';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    todayAttendanceRate: '0.0%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAdminStats((data) => {
      setStats(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const cardItems = [
    { label: 'Total Students', value: stats.totalStudents, icon: '🎓', color: '#4f46e5' },
    { label: 'Total Teachers', value: stats.totalTeachers, icon: '👨‍🏫', color: '#0ea5e9' },
    { label: 'Active Classes', value: stats.totalClasses, icon: '🏫', color: '#10b981' },
    { label: "Today's Attendance", value: stats.todayAttendanceRate, icon: '📊', color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Loading Live Dashboard Data...</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Admin Overview</h1>
          <p style={{ margin: 0 }}>Real-time Firebase metrics, active users, and global actions.</p>
        </div>
        <Link to="/admin/manage-users" className="btn">
          + Add New User
        </Link>
      </div>

      {/* Dynamic Stat Cards */}
      <div className="actions-grid" style={{ marginBottom: '32px' }}>
        {cardItems.map((stat, i) => (
          <div 
            key={i} 
            style={{ 
              background: '#fff', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>{stat.label}</span>
              <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
            </div>
            <h2 style={{ fontSize: '1.875rem', color: stat.color, marginTop: '8px', marginBottom: 0 }}>
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      <h3>Management Shortcuts</h3>
      <div className="actions-grid">
        <Link to="/admin/manage-users" className="btn btn-secondary" style={{ textAlign: 'left' }}>
          👥 <strong>Manage Users</strong>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Control Teachers & Students</div>
        </Link>
        <Link to="/admin/classes-subjects" className="btn btn-secondary" style={{ textAlign: 'left' }}>
          🏫 <strong>Classes & Subjects</strong>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Curriculum and Schedule</div>
        </Link>
        <Link to="/admin/settings" className="btn btn-secondary" style={{ textAlign: 'left' }}>
          ⚙️ <strong>System Settings</strong>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Academic Terms & Config</div>
        </Link>
      </div>
    </div>
  );
}