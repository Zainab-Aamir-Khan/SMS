import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';

export default function ManageGrades() {
  const { user } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch classes assigned to teacher
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

  // Fetch students for selected class
  useEffect(() => {
    if (!selectedClassId) return;
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student'), 
      where('classId', '==', selectedClassId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(list);
    });
    return () => unsub();
  }, [selectedClassId]);

  const handleMarkChange = (studentId, value) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      alert('Please enter a Task / Assignment Name');
      return;
    }
    if (students.length === 0) {
      alert('No students found in this class');
      return;
    }

    setSaving(true);
    try {
      const selectedClassObj = assignedClasses.find(c => c.id === selectedClassId);
      
      const promises = students.map(st => {
        const docId = `${selectedClassId}_${st.id}_${taskTitle.toLowerCase().replace(/\s+/g, '-')}`;
        return setDoc(doc(db, 'marks', docId), {
          classId: selectedClassId,
          className: selectedClassObj?.name || '',
          subjectName: selectedClassObj?.subjectName || '',
          studentId: st.id,
          studentName: st.name,
          taskTitle: taskTitle,
          obtainedMarks: Number(marks[st.id] || 0),
          totalMarks: Number(totalMarks),
          teacherId: user.uid,
          assignedAt: new Date().toISOString()
        }, { merge: true });
      });

      await Promise.all(promises);
      alert('Task & Marks assigned successfully!');
      setTaskTitle('');
      setMarks({});
    } catch (err) {
      alert('Error saving marks: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <h2>📝 Assign Tasks & Marks</h2>
      <p style={{ color: '#64748b' }}>Select a class, enter the task details, and grade students.</p>

      <form onSubmit={handleSaveMarks} style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select Class</label>
            <select 
              value={selectedClassId} 
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              {assignedClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name} - Sec {c.section} ({c.subjectName})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Task / Assignment Name</label>
            <input 
              type="text" 
              placeholder="e.g. Assignment 1 / Midterm Exam" 
              value={taskTitle} 
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Total Marks</label>
            <input 
              type="number" 
              value={totalMarks} 
              onChange={(e) => setTotalMarks(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        {students.length > 0 && (
          <table className="styled-table" style={{ marginTop: '16px', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Obtained Marks</th>
              </tr>
            </thead>
            <tbody>
              {students.map(st => (
                <tr key={st.id}>
                  <td><strong>{st.name}</strong></td>
                  <td>{st.email}</td>
                  <td>
                    <input 
                      type="number" 
                      placeholder={`0 - ${totalMarks}`}
                      value={marks[st.id] ?? ''} 
                      onChange={(e) => handleMarkChange(st.id, e.target.value)}
                      max={totalMarks}
                      min={0}
                      style={{ padding: '6px 10px', width: '100px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Saving...' : 'Submit Task & Marks'}
        </button>
      </form>
    </div>
  );
}