import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDocs 
} from 'firebase/firestore';
import AttendanceCalendar from '../../components/AttendanceCalendar';

export default function ClassAttendance() {
  const { user } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  
  const [viewMode, setViewMode] = useState('mark'); // 'mark' | 'calendar'
  const [selectedStudentForCal, setSelectedStudentForCal] = useState('');
  const [studentCalData, setStudentCalData] = useState({});

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

  // 2. Fetch Students & Existing Attendance for Selected Class and Date
  useEffect(() => {
    if (!selectedClassId) return;

    const qStudents = query(
      collection(db, 'users'), 
      where('role', '==', 'student'), 
      where('classId', '==', selectedClassId)
    );

    const unsubStudents = onSnapshot(qStudents, async (snap) => {
      const stList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(stList);

      if (stList.length > 0 && !selectedStudentForCal) {
        setSelectedStudentForCal(stList[0].id);
      }

      // Fetch today's (or selected date's) existing attendance records
      const qAtt = query(
        collection(db, 'attendance'),
        where('classId', '==', selectedClassId),
        where('date', '==', selectedDate)
      );

      const attSnap = await getDocs(qAtt);
      const existingMap = {};
      attSnap.docs.forEach(d => {
        const data = d.data();
        existingMap[data.studentId] = data.status;
      });

      // Build initial attendance state: use existing record if available, else default to 'present'
      const initialMap = {};
      stList.forEach(s => {
        initialMap[s.id] = existingMap[s.id] || 'present';
      });

      setAttendance(initialMap);
    });

    return () => unsubStudents();
  }, [selectedClassId, selectedDate]);

  // 3. Load Selected Student's Full History for Calendar View
  useEffect(() => {
    if (!selectedClassId || !selectedStudentForCal || viewMode !== 'calendar') return;

    const q = query(
      collection(db, 'attendance'),
      where('classId', '==', selectedClassId),
      where('studentId', '==', selectedStudentForCal)
    );

    const unsub = onSnapshot(q, (snap) => {
      const history = {};
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.date) {
          history[data.date] = data.status;
        }
      });
      setStudentCalData(history);
    });

    return () => unsub();
  }, [selectedClassId, selectedStudentForCal, viewMode]);

  // Handle Dropdown Change
  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  // 4. Save Attendance Complete Logic
  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      alert('No students to mark!');
      return;
    }

    setSaving(true);
    try {
      const promises = students.map(st => {
        const status = attendance[st.id] || 'present';
        // Clean composite document ID to avoid nested collection errors
        const attDocId = `${selectedClassId}_${st.id}_${selectedDate}`;

        return setDoc(doc(db, 'attendance', attDocId), {
          classId: selectedClassId,
          studentId: st.id,
          studentName: st.name,
          date: selectedDate,
          status: status,
          markedBy: user.uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await Promise.all(promises);
      alert(`Attendance for ${selectedDate} saved successfully!`);
    } catch (err) {
      alert('Error saving attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Top Header & View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2>📋 Class Attendance Register</h2>
        
        <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setViewMode('mark')}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              background: viewMode === 'mark' ? '#4f46e5' : 'transparent',
              color: viewMode === 'mark' ? '#fff' : '#64748b',
              fontWeight: 600
            }}
          >
            Mark Daily Attendance
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              background: viewMode === 'calendar' ? '#4f46e5' : 'transparent',
              color: viewMode === 'calendar' ? '#fff' : '#64748b',
              fontWeight: 600
            }}
          >
            📅 Student Calendar View
          </button>
        </div>
      </div>

      {/* Class & Date Selectors */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select Class</label>
          <select 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '220px' }}
          >
            {assignedClasses.length === 0 && <option value="">No Classes Assigned</option>}
            {assignedClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name} - Sec {c.section} ({c.subjectName})</option>
            ))}
          </select>
        </div>

        {viewMode === 'mark' && (
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Attendance Date</label>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        )}
      </div>

      {/* VIEW MODE 1: DAILY MARKING TABLE */}
      {viewMode === 'mark' && (
        <>
          {students.length === 0 ? (
            <p style={{ color: '#64748b' }}>No students enrolled in this class yet.</p>
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
                          style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
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

              <button 
                onClick={handleSaveAttendance} 
                className="btn"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </>
          )}
        </>
      )}

      {/* VIEW MODE 2: CALENDAR INSPECTION */}
      {viewMode === 'calendar' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 600 }}>Select Student to Inspect Calendar: </label>
            <select
              value={selectedStudentForCal}
              onChange={(e) => setSelectedStudentForCal(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginLeft: '8px' }}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>

          <AttendanceCalendar attendanceData={studentCalData} />
        </div>
      )}
    </div>
  );
}