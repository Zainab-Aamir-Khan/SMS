import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';

export default function ClassAttendance() {
  const { user } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Fetch Teacher's Assigned Classes
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const cls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAssignedClasses(cls);
      if (cls.length > 0 && !selectedClassId) {
        setSelectedClassId(cls[0].id);
      }
    });
    return () => unsub();
  }, [user, selectedClassId]);

  // 2. Fetch Students of Selected Class & Section
  useEffect(() => {
    if (!selectedClassId) return;
    const q = query(collection(db, 'users'), where('role', '==', 'student'), where('classId', '==', selectedClassId));
    const unsub = onSnapshot(q, (snap) => {
      const stList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(stList);

      // Default all to 'present'
      const initialAtt = {};
      stList.forEach(s => { initialAtt[s.id] = 'present'; });
      setAttendance(initialAtt);
    });
    return () => unsub();
  }, [selectedClassId]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    try {
      const promises = Object.keys(attendance).map(studentId => {
        const attId = `${selectedClassId}_${studentId}_${todayStr}`;
        return setDoc(doc(db, 'attendance', attId), {
          classId: selectedClassId,
          studentId,
          status: attendance[studentId],
          date: todayStr,
          markedBy: user.uid,
          updatedAt: new Date().toISOString()
        });
      });

      await Promise.all(promises);
      alert('Attendance saved successfully!');
    } catch (err) {
      alert('Error saving attendance: ' + err.message);
    }
  };

  const activeClassObj = assignedClasses.find(c => c.id === selectedClassId);

  return (
    <div className="page-container">
      <h2>📋 Class Attendance Register</h2>
      <p>Select your assigned class to load student roster.</p>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label><strong>Select Assigned Class:</strong></label>
        <select 
          value={selectedClassId} 
          onChange={(e) => setSelectedClassId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        >
          {assignedClasses.map(c => (
            <option key={c.id} value={c.id}>{c.name} - Sec {c.section} ({c.subjectName})</option>
          ))}
        </select>
      </div>

      {activeClassObj && (
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
          <span>Class: <strong>{activeClassObj.name}</strong></span> | 
          <span> Section: <strong>{activeClassObj.section}</strong></span> | 
          <span> Subject: <strong>{activeClassObj.subjectName}</strong></span>
        </div>
      )}

      <h3>Student List ({students.length})</h3>
      {students.length === 0 ? (
        <p>No students enrolled in this class yet. Assign students via Admin Panel.</p>
      ) : (
        <>
          <table className="styled-table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.email}</td>
                  <td>
                    <select
                      value={attendance[s.id] || 'present'}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="leave">Leave</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSaveAttendance} className="btn">Save Attendance</button>
        </>
      )}
    </div>
  );
}