import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeTeacherData } from '../../services/dashboardService';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeTeacherData(user.uid, (classes) => {
      setAssignedClasses(classes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Fetching Assigned Classes...</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Teacher Portal</h1>
          <p style={{ margin: 0 }}>Welcome back, <strong>{user?.name}</strong>. Here are your assigned classes.</p>
        </div>
        <Link to="/teacher/attendance" className="btn">
          ✏️ Attendance Portal
        </Link>
      </div>

      <div className="actions-grid" style={{ marginBottom: '32px' }}>
        <Link to="/teacher/attendance" className="btn btn-secondary" style={{ textAlign: 'center', padding: '16px' }}>
          📋 <div><strong>Class Attendance</strong></div>
        </Link>
        <Link to="/teacher/grades" className="btn btn-secondary" style={{ textAlign: 'center', padding: '16px' }}>
          📝 <div><strong>Marks & Grading</strong></div>
        </Link>
      </div>

      <h3>Your Assigned Classes ({assignedClasses.length})</h3>
      {assignedClasses.length === 0 ? (
        <p style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
          No classes currently assigned to your profile by the Administrator.
        </p>
      ) : (
        <table className="styled-table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Today's Attendance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignedClasses.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.name}</strong></td>
                <td>{item.section || 'A'}</td>
                <td>{item.subjectName || 'N/A'}</td>
                <td>
                  <span 
                    style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      background: item.attendanceStatus === 'Completed' ? '#dcfce7' : '#fef3c7',
                      color: item.attendanceStatus === 'Completed' ? '#15803d' : '#b45309',
                      fontWeight: 600
                    }}
                  >
                    {item.attendanceStatus}
                  </span>
                </td>
                <td>
                  <Link to="/teacher/attendance" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
                    {item.attendanceStatus === 'Completed' ? 'View/Edit' : 'Mark Now →'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}