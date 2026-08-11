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

  // Form states for creating a new class
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('A');

  // Form states for adding a subject
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  // Inline forms state for adding subject+teacher to a specific class ID
  const [addingToClassId, setAddingToClassId] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');

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

  // 2. Add New Class (starts with an empty assignments array)
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!className) return;

    try {
      const newDocRef = doc(collection(db, 'classes'));

      await setDoc(newDocRef, {
        name: className,
        section,
        subjectAssignments: [], // Holds [{ subjectName, teacherId, teacherName }]
        createdAt: new Date().toISOString()
      });

      setClassName('');
      setSection('A');
    } catch (err) {
      alert('Failed to add class: ' + err.message);
    }
  };

  // 3. Add Subject & Teacher pair to a specific Class
  const handleAddSubjectToClass = async (classId) => {
    if (!newSubName) {
      alert('Please select or enter a subject name');
      return;
    }

    try {
      const classObj = classesList.find(c => c.id === classId);
      const selectedTeacher = teachersList.find(t => t.id === newTeacherId);
      
      const currentAssignments = classObj?.subjectAssignments || [];

      // Backward compatibility fallback for old single-subject classes
      if (currentAssignments.length === 0 && classObj?.subjectName) {
        currentAssignments.push({
          subjectName: classObj.subjectName,
          teacherId: classObj.teacherId || '',
          teacherName: classObj.teacherName || 'Unassigned'
        });
      }

      const updatedAssignments = [
        ...currentAssignments,
        {
          subjectName: newSubName,
          teacherId: newTeacherId || '',
          teacherName: selectedTeacher ? selectedTeacher.name : 'Unassigned'
        }
      ];

      await updateDoc(doc(db, 'classes', classId), {
        subjectAssignments: updatedAssignments,
        // Update main subjectName & teacherId for backwards compatibility
        subjectName: updatedAssignments[0]?.subjectName || '',
        teacherId: updatedAssignments[0]?.teacherId || ''
      });

      // Reset inline form
      setAddingToClassId(null);
      setNewSubName('');
      setNewTeacherId('');
    } catch (err) {
      alert('Error assigning subject: ' + err.message);
    }
  };

  // 4. Remove a Subject Assignment from a Class
  const handleRemoveSubjectFromClass = async (classId, indexToRemove) => {
    try {
      const classObj = classesList.find(c => c.id === classId);
      const currentAssignments = classObj?.subjectAssignments || [];
      const updated = currentAssignments.filter((_, idx) => idx !== indexToRemove);

      await updateDoc(doc(db, 'classes', classId), {
        subjectAssignments: updated,
        subjectName: updated[0]?.subjectName || '',
        teacherId: updated[0]?.teacherId || ''
      });
    } catch (err) {
      alert('Error removing subject assignment: ' + err.message);
    }
  };

  // 5. Add New Global Subject
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
    if (window.confirm('Delete this class section?')) {
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
        <h2>Loading Classes, Subjects & Teachers...</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>🏫 Classes & Subjects Management</h2>
      <p style={{ color: '#64748b' }}>Configure classes and assign multiple subjects with dedicated teachers.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '20px' }}>
        
        {/* --- CLASS BUILDER & MULTI-SUBJECT MANAGER --- */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3>Create Class</h3>
          <form onSubmit={handleAddClass} style={{ display: 'flex', gap: '10px', marginTop: '12px', marginBottom: '24px' }}>
            <input
              type="text"
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. Class 11"
              style={{ flex: 2, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="A">Sec A</option>
              <option value="B">Sec B</option>
              <option value="C">Sec C</option>
              <option value="D">Sec D</option>
            </select>
            <button type="submit" className="btn" style={{ padding: '8px 16px' }}>
              + Create
            </button>
          </form>

          {/* ACTIVE CLASSES LIST */}
          <h4>Active Classes ({classesList.length})</h4>
          {classesList.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No classes created yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {classesList.map((c) => {
                // Get assignments array (with fallback for legacy records)
                const assignments = c.subjectAssignments && c.subjectAssignments.length > 0
                  ? c.subjectAssignments
                  : (c.subjectName ? [{ subjectName: c.subjectName, teacherId: c.teacherId, teacherName: c.teacherName || 'Unassigned' }] : []);

                return (
                  <div key={c.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>{c.name} - Section {c.section}</strong>
                      <button 
                        onClick={() => handleDeleteClass(c.id)}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Delete Class
                      </button>
                    </div>

                    {/* Assigned Subjects & Teachers List */}
                    <div style={{ background: '#fff', borderRadius: '6px', padding: '8px 12px', border: '1px solid #cbd5e1', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Subjects ({assignments.length})</span>
                      
                      {assignments.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '6px 0 0 0' }}>No subjects assigned yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                          {assignments.map((assign, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '4px 0', borderBottom: idx !== assignments.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <span>
                                <strong>{assign.subjectName}</strong> → <span style={{ color: '#4f46e5', fontWeight: 600 }}>{assign.teacherName}</span>
                              </span>
                              <button
                                onClick={() => handleRemoveSubjectFromClass(c.id, idx)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Inline Form to Add Subject & Assign Teacher */}
                    {addingToClassId === c.id ? (
                      <div style={{ background: '#eef2ff', padding: '10px', borderRadius: '6px', border: '1px solid #c7d2fe' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: '#3730a3' }}>Assign New Subject & Teacher</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <select
                            value={newSubName}
                            onChange={(e) => setNewSubName(e.target.value)}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          >
                            <option value="">-- Select Subject --</option>
                            {subjectsList.map(s => (
                              <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                          </select>

                          <select
                            value={newTeacherId}
                            onChange={(e) => setNewTeacherId(e.target.value)}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          >
                            <option value="">-- Assign Teacher --</option>
                            {teachersList.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                            ))}
                          </select>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button
                              onClick={() => handleAddSubjectToClass(c.id)}
                              style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setAddingToClassId(null)}
                              style={{ background: '#94a3b8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingToClassId(c.id);
                          setNewSubName('');
                          setNewTeacherId('');
                        }}
                        style={{ width: '100%', background: '#fff', border: '1px dashed #4f46e5', color: '#4f46e5', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                      >
                        + Add Subject & Assign Teacher
                      </button>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- GLOBAL SUBJECT BUILDER PANEL --- */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: 'fit-content' }}>
          <h3>Subject Manager</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Create global subjects that can be assigned to any class.</p>
          
          <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subject Name</label>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Physics"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subject Code (Optional)</label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. PHY-101"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <button type="submit" className="btn" style={{ marginTop: '8px' }}>
              + Create Subject
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