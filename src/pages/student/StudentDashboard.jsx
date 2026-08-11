import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AttendanceCalendar from '../../components/AttendanceCalendar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState({});
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Student Attendance
  useEffect(() => {
    if (!user?.uid) return;

    const qAtt = query(
      collection(db, 'attendance'),
      where('studentId', '==', user.uid)
    );

    const unsubAtt = onSnapshot(qAtt, (snap) => {
      const history = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.date) {
          history[data.date] = data.status;
        }
      });
      setAttendanceData(history);
    });

    return () => unsubAtt();
  }, [user]);

  // 2. Fetch Tasks & Marks Assigned to this Student
  useEffect(() => {
    if (!user?.uid) return;

    const qMarks = query(
      collection(db, 'marks'),
      where('studentId', '==', user.uid)
    );

    const unsubMarks = onSnapshot(qMarks, (snap) => {
      const taskList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAssignedTasks(taskList);
      setLoading(false);
    });

    return () => unsubMarks();
  }, [user]);

  if (loading) return <div className="page-container">Loading Dashboard...</div>;

  return (
    <div className="page-container">
      <h2>🎓 Welcome, {user?.name || 'Student'}</h2>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>Overview of your performance and attendance.</p>

      {/* SECTION 1: ASSIGNED TASKS & MARKS */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '12px' }}>📌 Assigned Tasks & Marks</h3>
        
        {assignedTasks.length === 0 ? (
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            No tasks or marks assigned yet.
          </div>
        ) : (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Task / Assignment Name</th>
                <th>Subject</th>
                <th>Obtained Marks</th>
                <th>Total Marks</th>
                <th>Percentage</th>
                <th>Assigned Date</th>
              </tr>
            </thead>
            <tbody>
              {assignedTasks.map(t => {
                const percentage = t.totalMarks ? ((t.obtainedMarks / t.totalMarks) * 100).toFixed(1) : 0;
                let badgeBg = '#dcfce7';
                let badgeColor = '#15803d';

                if (percentage < 50) {
                  badgeBg = '#fee2e2';
                  badgeColor = '#b91c1c';
                } else if (percentage < 75) {
                  badgeBg = '#fef3c7';
                  badgeColor = '#b45309';
                }

                return (
                  <tr key={t.id}>
                    <td><strong>{t.taskTitle}</strong></td>
                    <td>{t.subjectName || 'General'}</td>
                    <td style={{ fontWeight: 700 }}>{t.obtainedMarks}</td>
                    <td>{t.totalMarks}</td>
                    <td>
                      <span style={{ background: badgeBg, color: badgeColor, padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                        {percentage}%
                      </span>
                    </td>
                    <td>{t.assignedAt ? new Date(t.assignedAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* SECTION 2: ATTENDANCE CALENDAR */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '12px' }}>📅 Monthly Attendance Calendar</h3>
        <AttendanceCalendar attendanceData={attendanceData} />
      </div>
    </div>
  );
}