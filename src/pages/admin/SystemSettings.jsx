import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    schoolName: 'SMS Portal',
    academicYear: '2026-2027',
    activeSemester: 'Fall Semester',
    allowRegistration: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Subscribe to Live Settings Document in Firestore
  useEffect(() => {
    const docRef = doc(db, 'settings', 'global');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Save Updated Settings to Firestore
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
      setMessage('System configurations saved successfully!');
    } catch (err) {
      setMessage('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Loading Settings from Firebase...</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>System Settings</h2>
      <p>Configure portal options, current academic term, and global preferences stored in Firebase.</p>

      {message && (
        <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', background: message.includes('Error') ? '#fee2e2' : '#dcfce7', color: message.includes('Error') ? '#991b1b' : '#166534' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ maxWidth: '600px' }}>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>Institution / Portal Name</label>
          <input
            type="text"
            required
            value={settings.schoolName || ''}
            onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>Academic Year</label>
          <input
            type="text"
            required
            value={settings.academicYear || ''}
            onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
            placeholder="e.g. 2026-2027"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>Active Term / Semester</label>
          <select
            value={settings.activeSemester || 'Fall Semester'}
            onChange={(e) => setSettings({ ...settings, activeSemester: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="Fall Semester">Fall Semester</option>
            <option value="Spring Semester">Spring Semester</option>
            <option value="Summer Term">Summer Term</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="allowReg"
            checked={!!settings.allowRegistration}
            onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="allowReg" style={{ cursor: 'pointer', fontWeight: 600 }}>
            Allow Public Student/Teacher Self-Registration
          </label>
        </div>

        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}