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

export default function ManageGrades() {
  const { user } = useAuth();
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [examType, setExamType] = useState('Mid Term');
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Helper to calculate Grade and GPA automatically
  const calculateGradeAndGpa = (obtained, total) => {
    const obt = parseFloat(obtained) || 0;
    const tot = parseFloat(total) || 100;
    if (tot === 0) return { grade: 'N/A', gpa: 0 };

    const percentage = (obt / tot) * 100;

    if (percentage >= 90) return { grade: 'A+', gpa: 4.0 };
    if (percentage >= 80) return { grade: 'A', gpa: 3.7 };
    if (percentage >= 70) return { grade: 'B', gpa: 3.0 };
    if (percentage >= 60) return { grade: 'C', gpa: 2.0 };
    if (percentage >= 50) return { grade: 'D', gpa: 1.0 };
    return { grade: 'F', gpa: 0.0 };
  };

  // 1. Fetch Teacher's Assigned Classes
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const clsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAssignedClasses(clsList);
      if (clsList.length > 0 && !selectedClassId) {
        setSelectedClassId(clsList[0].id);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user, selectedClassId]);

  // 2. Fetch Enrolled Students & Saved Marks for Selected Class
  useEffect(() => {
    if (!selectedClassId) return;

    // Query enrolled students
    const qStudents = query(
      collection(db, 'users'), 
      where('role', '==', 'student'), 
      where('classId', '==', selectedClassId)
    );

    const unsubStudents = onSnapshot(qStudents, async (snap) => {
      const stList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(stList);

      // Fetch existing marks for this class & exam type
      const qMarks = query(
        collection(db, 'marks'),
        where('classId', '==', selectedClassId),
        where('examType', '==', examType)
      );
      const marksSnap = await getDocs(qMarks);
      
      const existingMarks = {};
      marksSnap.docs.forEach(d => {
        const data = d.data();
        existingMarks[data.studentId] = {
          obtainedMarks: data.obtainedMarks || '',
          totalMarks: data.totalMarks || 100,
          grade: data.grade || 'F',
          gpa: data.gpa || 0.0
        };
      });

      // Default values for students without existing records
      const initialMap = {};
      stList.forEach(s => {
        initialMap[s.id] = existingMarks[s.id] || {
          obtainedMarks: '',
          totalMarks: 100,
          grade: '-',
          gpa: 0.0
        };
      });

      setMarksData(initialMap);
    });

    return () => unsubStudents();
  }, [selectedClassId, examType]);

  // Handle Mark Changes with Auto-Calculation
  const handleMarkChange = (studentId, field, value) => {
    setMarksData(prev => {
      const current = prev[studentId] || { obtainedMarks: '', totalMarks: 100 };
      const updated = { ...current, [field]: value };

      // Calculate auto Grade & GPA
      const calc = calculateGradeAndGpa(
        field === 'obtainedMarks' ? value : updated.obtainedMarks,
        field === 'totalMarks' ? value : updated.totalMarks
      );

      return {
        ...prev,
        [studentId]: {
          ...updated,
          grade: calc.grade,
          gpa: calc.gpa
        }
      };
    });
  };

  // Save Marks to Firestore
  const handleSaveGrades = async () => {
  if (!selectedClassId) return;
  setSaving(true);

  try {
    const activeClass = assignedClasses.find(c => c.id === selectedClassId);

    const promises = students.map(student => {
      const studentMarks = marksData[student.id] || {};
      
      // Sanitized unique document key (no slashes or invalid path characters)
      const cleanExamType = examType.replace(/[^a-zA-Z0-9]/g, '');
      const docKey = `${selectedClassId}_${student.id}_${cleanExamType}`;

      // Clean single doc reference
      const markDocRef = doc(db, 'marks', docKey);

      return setDoc(markDocRef, {
        studentId: student.id,
        studentName: student.name,
        classId: selectedClassId,
        className: activeClass?.name || '',
        section: activeClass?.section || '',
        subjectName: activeClass?.subjectName || 'N/A',
        examType,
        obtainedMarks: Number(studentMarks.obtainedMarks) || 0,
        totalMarks: Number(studentMarks.totalMarks) || 100,
        grade: studentMarks.grade || 'F',
        gpa: Number(studentMarks.gpa) || 0.0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    await Promise.all(promises);
    alert('Grades saved successfully!');
  } catch (err) {
    alert('Failed to save grades: ' + err.message);
  } finally {
    setSaving(false);
  }
};

  const activeClassObj = assignedClasses.find(c => c.id === selectedClassId);

  if (loading) {
    return <div className="page-container" style={{ textAlign: 'center', padding: '40px' }}>Loading Classes & Students...</div>;
  }

  return (
    <div className="page-container">
      <h2>Grade Entry Portal</h2>
      <p>Input exam marks, assignments, and auto-calculate student grades in real-time.</p>

      {/* Class & Exam Selectors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select Class</label>
          <select 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '200px' }}
          >
            {assignedClasses.length === 0 && <option value="">No Classes Assigned</option>}
            {assignedClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name} - Sec {c.section} ({c.subjectName})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Exam Type</label>
          <select 
            value={examType} 
            onChange={(e) => setExamType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '160px' }}
          >
            <option value="Mid Term">Mid Term</option>
            <option value="Final Term">Final Term</option>
            <option value="Monthly Test">Monthly Test</option>
            <option value="Quiz">Quiz</option>
          </select>
        </div>
      </div>

      {/* Dynamic Marks Table */}
      {students.length === 0 ? (
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, color: '#64748b' }}>
            No students enrolled in this class yet. Assign students to this class in the Admin Panel.
          </p>
        </div>
      ) : (
        <>
          <table className="styled-table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Obtained Marks</th>
                <th>Total Marks</th>
                <th>Grade</th>
                <th>GPA</th>
              </tr>
            </thead>
            <tbody>
              {students.map(st => {
                const smData = marksData[st.id] || { obtainedMarks: '', totalMarks: 100, grade: '-', gpa: 0.0 };

                return (
                  <tr key={st.id}>
                    <td><strong>{st.name}</strong></td>
                    <td>{activeClassObj?.subjectName || 'N/A'}</td>
                    <td>
                      <input 
                        type="number"
                        min="0"
                        max={smData.totalMarks}
                        value={smData.obtainedMarks}
                        onChange={(e) => handleMarkChange(st.id, 'obtainedMarks', e.target.value)}
                        placeholder="Marks"
                        style={{ width: '90px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        min="1"
                        value={smData.totalMarks}
                        onChange={(e) => handleMarkChange(st.id, 'totalMarks', e.target.value)}
                        style={{ width: '80px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td>
                      <span 
                        style={{ 
                          fontWeight: 700, 
                          padding: '4px 10px', 
                          borderRadius: '12px',
                          background: smData.grade.startsWith('A') ? '#dcfce7' : smData.grade === 'F' ? '#fee2e2' : '#e0f2fe',
                          color: smData.grade.startsWith('A') ? '#166534' : smData.grade === 'F' ? '#991b1b' : '#075985'
                        }}
                      >
                        {smData.grade}
                      </span>
                    </td>
                    <td><strong>{smData.gpa}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button 
            onClick={handleSaveGrades} 
            className="btn" 
            disabled={saving}
          >
            {saving ? 'Saving Marks...' : 'Save Grades'}
          </button>
        </>
      )}
    </div>
  );
}