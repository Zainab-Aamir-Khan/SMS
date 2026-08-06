import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Fetch current logged in student record to get classId
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), async (userSnap) => {
      const uData = userSnap.data();
      if (uData?.classId) {
        // Fetch class, teacher, & subject details mapped to this student
        const classSnap = await getDoc(doc(db, 'classes', uData.classId));
        if (classSnap.exists()) {
          setClassDetails(classSnap.data());
        }
      }
      setLoading(false);
    });

    return () => unsubUser();
  }, [user]);

  if (loading) return <div className="page-container">Loading Student Portal...</div>;

  return (
    <div className="page-container">
      <h2>🎓 Welcome, {user?.name}</h2>

      {/* Class & Subject Info Banner */}
      <div style={{ background: '#eef2ff', padding: '20px', borderRadius: '8px', border: '1px solid #c7d2fe', marginBottom: '24px' }}>
        <h3>Enrolled Class Profile</h3>
        {classDetails ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '12px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>Class & Section</span>
              <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{classDetails.name} ({classDetails.section})</h4>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>Assigned Subject</span>
              <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{classDetails.subjectName || 'N/A'}</h4>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>Class Teacher</span>
              <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{classDetails.teacherName || 'Unassigned'}</h4>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748b', margin: 0 }}>You are not currently enrolled in any class section. Please contact Admin.</p>
        )}
      </div>
    </div>
  );
}