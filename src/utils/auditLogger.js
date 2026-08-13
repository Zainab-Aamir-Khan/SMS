// src/utils/auditLogger.js
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const logAuditAction = async (user, actionType, details) => {
  try {
    // Optional: Fetch client IP address
    let ipAddress = 'Unknown';
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip;
    } catch (ipErr) {
      console.warn("Could not fetch IP address", ipErr);
    }

    const logPayload = {
      actionType, // e.g., 'MARKS_CREATED', 'MARKS_UPDATED', 'ATTENDANCE_MODIFIED'
      performedBy: user?.uid || 'system',
      performerName: user?.name || user?.email || 'Administrator',
      role: user?.role || 'admin',
      details, // Object containing description, oldValues, newValues, target student/class
      ipAddress,
      timestamp: new Date().toISOString()
    };

    await addDoc(collection(db, 'audit_logs'), logPayload);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};