import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  query,
  where 
} from 'firebase/firestore';

export default function ClassesSubjects() {
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('A');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState('');

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  // 1. Subscribe to Firestore Collections
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClassesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      setSubjectsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubTeachers = onSnapshot(teachersQuery, (snapshot) => {
      setTeachersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubClasses();
      unsubSubjects();
      unsubTeachers();
    };
  }, []);

  // 2. Add New Class with Teacher & Subject
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!className) return;

    try {
      const selectedTeacher = teachersList.find(t => t.id === selectedTeacherId);
      const newDocRef = doc(collection(db, 'classes'));

      await setDoc(newDocRef, {
        name: className,
        section,
        teacherId: selectedTeacherId || '',
        teacherName: selectedTeacher ? selectedTeacher.name : 'Unassigned',
        subjectName: selectedSubjectName || 'N/A',
        createdAt: new Date().toISOString()
      });

      setClassName('');
      setSelectedTeacherId('');
      setSelectedSubjectName('');
    } catch (err) {
      alert('Failed to add class: ' + err.message);
    }
  };

  // 3. Update Teacher Assignment for Existing Class
  const handleAssignTeacher = async (classId, teacherId) => {
    try {
      const selectedTeacher = teachersList.find(t => t.id === teacherId);
      await updateDoc(doc(db, 'classes', classId), {
        teacherId: teacherId,
        teacherName: selectedTeacher ? selectedTeacher.name : 'Unassigned'
      });
    } catch (err) {
      alert('Error assigning teacher: ' + err.message);
    }
  };

  // 4. Update Subject Assignment for Existing Class
  const handleAssignSubject = async (classId, subjectNameVal) => {
    try {
      await updateDoc(doc(db, 'classes', classId), {
        subjectName: subjectNameVal || 'N/A'
      });
    } catch (err) {
      alert('Error assigning subject: ' + err.message);
    }
  };

  // 5. Add Subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjectName) return;

    try {
      const newDocRef = doc(collection(db, 'subjects'));
      await setDoc(newDocRef, {
        name: subjectName,
        code: subjectCode || 'N/A',
        createdAt: new Date().toISOString()
      });
      setSubjectName('');
      setSubjectCode('');
    } catch (err) {
      alert('Failed to add subject: ' + err.message);
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Delete this class?')) {
      await deleteDoc(doc(db, 'classes', id));
    }
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Delete this subject?')) {
      await deleteDoc(doc(db, 'subjects', id));
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Loading Classes & Subjects...</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>🏫 Classes & Subjects Management</h2>
      <p>Assign teachers and subjects to classes in real-time.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginTop: '20px' }}>
        
        {/* --- CLASS BUILDER & ASSIGNMENT PANEL --- */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3>Create Class & Assign Details</h3>
          <form onSubmit={handleAddClass} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Class Name</label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Class 10"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subject</label>
                <select
                  value={selectedSubjectName}
                  onChange={(e) => setSelectedSubjectName(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select Subject</option>
                  {subjectsList.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Assign Class Teacher</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Choose Teacher --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn" style={{ marginTop: '8px' }}>
              + Create & Assign Class
            </button>
          </form>

          {/* ACTIVE CLASSES LIST WITH LIVE EDITING */}
          <h4 style={{ marginTop: '24px' }}>Active Classes ({classesList.length})</h4>
          {classesList.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No classes created yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {classesList.map((c) => (
                <div key={c.id} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{c.name} - Section {c.section}</strong>
                    <button 
                      onClick={() => handleDeleteClass(c.id)}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Quick Teacher Selection */}
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '55px' }}>Teacher:</span>
                    <select
                      value={c.teacherId || ''}
                      onChange={(e) => handleAssignTeacher(c.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', flex: 1 }}
                    >
                      <option value="">-- Unassigned --</option>
                      {teachersList.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Subject Selection */}
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '55px' }}>Subject:</span>
                    <select
                      value={c.subjectName || ''}
                      onChange={(e) => handleAssignSubject(c.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', flex: 1 }}
                    >
                      <option value="">-- Select Subject --</option>
                      {subjectsList.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- SUBJECT BUILDER PANEL --- */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3>Subject Manager</h3>
          <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subject Name</label>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Mathematics"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subject Code (Optional)</label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. MATH-101"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <button type="submit" className="btn" style={{ marginTop: '8px' }}>
              + Add Subject
            </button>
          </form>

          <h4 style={{ marginTop: '24px' }}>Curriculum Subjects ({subjectsList.length})</h4>
          {subjectsList.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No subjects added yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {subjectsList.map((s) => (
                <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span><strong>{s.name}</strong> <small style={{ color: '#64748b' }}>({s.code})</small></span>
                  <button 
                    onClick={() => handleDeleteSubject(s.id)}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
} 