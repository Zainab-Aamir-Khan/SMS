import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc 
} from 'firebase/firestore';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [assignedClassId, setAssignedClassId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Live stream users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Live stream classes
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubClasses();
    };
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const selectedClassObj = classes.find(c => c.id === assignedClassId);
      const newDocRef = doc(collection(db, 'users'));

      await setDoc(newDocRef, {
        name,
        email,
        role,
        classId: role === 'student' ? (assignedClassId || '') : '',
        className: role === 'student' && selectedClassObj ? selectedClassObj.name : '',
        section: role === 'student' && selectedClassObj ? selectedClassObj.section : '',
        createdAt: new Date().toISOString(),
      });

      setName('');
      setEmail('');
      setRole('student');
      setAssignedClassId('');
    } catch (err) {
      setError('Failed to add user: ' + err.message);
    }
  };

  const handleClassAssignment = async (userId, classId) => {
    try {
      const selectedClassObj = classes.find(c => c.id === classId);
      await updateDoc(doc(db, 'users', userId), {
        classId: classId || '',
        className: selectedClassObj ? selectedClassObj.name : '',
        section: selectedClassObj ? selectedClassObj.section : '',
      });
    } catch (err) {
      alert('Error assigning class: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Delete this user record?')) {
      await deleteDoc(doc(db, 'users', userId));
    }
  };

  if (loading) return <div className="page-container">Loading Users & Class Mapping...</div>;

  return (
    <div className="page-container">
      <h2>Manage System Users & Enrollments</h2>

      {/* Add User Card */}
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3>+ Create User & Assign Class</h3>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Student Name" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@sms.com" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {role === 'student' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Enroll in Class</label>
              <select value={assignedClassId} onChange={(e) => setAssignedClassId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Select Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Sec {c.section}) - {c.subjectName}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn" style={{ width: '100%', height: '38px' }}>Save User</button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <table className="styled-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Assigned Class & Section</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td><strong>{u.name}</strong></td>
              <td>{u.email}</td>
              <td><span className="role-badge">{u.role}</span></td>
              <td>
                {u.role === 'student' ? (
                  <select
                    value={u.classId || ''}
                    onChange={(e) => handleClassAssignment(u.id, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Not Assigned --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - Sec {c.section}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ color: '#94a3b8' }}>N/A (Teacher/Admin)</span>
                )}
              </td>
              <td>
                <button onClick={() => handleDeleteUser(u.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}