import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

/**
 * 1. ADMIN DASHBOARD LIVE METRICS
 */
export const subscribeAdminStats = (callback) => {
  const usersRef = collection(db, 'users');
  const classesRef = collection(db, 'classes');
  const attendanceRef = collection(db, 'attendance');

  // Real-time listener for users (Students & Teachers count)
  const unsubUsers = onSnapshot(usersRef, (snapshot) => {
    let studentCount = 0;
    let teacherCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.role === 'student') studentCount++;
      if (data.role === 'teacher') teacherCount++;
    });

    callback((prev) => ({
      ...prev,
      totalStudents: studentCount,
      totalTeachers: teacherCount,
    }));
  });

  // Real-time listener for active classes count
  const unsubClasses = onSnapshot(classesRef, (snapshot) => {
    callback((prev) => ({
      ...prev,
      totalClasses: snapshot.size,
    }));
  });

  // Real-time listener for today's attendance calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttQuery = query(attendanceRef, where('date', '==', todayStr));

  const unsubAttendance = onSnapshot(todayAttQuery, (snapshot) => {
    let presentCount = 0;
    let totalRecords = snapshot.size;

    snapshot.docs.forEach((doc) => {
      if (doc.data().status === 'present') presentCount++;
    });

    const percentage = totalRecords > 0 
      ? ((presentCount / totalRecords) * 100).toFixed(1) + '%' 
      : '0.0%';

    callback((prev) => ({
      ...prev,
      todayAttendanceRate: percentage,
    }));
  });

  // Return unsubscribe functions for component cleanup
  return () => {
    unsubUsers();
    unsubClasses();
    unsubAttendance();
  };
};

/**
 * 2. TEACHER DASHBOARD LIVE DATA
 */
export const subscribeTeacherData = (teacherUid, callback) => {
  const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', teacherUid));
  const todayStr = new Date().toISOString().split('T')[0];

  return onSnapshot(classesQuery, async (snapshot) => {
    const assignedClasses = [];

    for (const classDoc of snapshot.docs) {
      const classData = { id: classDoc.id, ...classDoc.data() };
      
      // Check if attendance is already completed for today
      const attCheckQuery = query(
        collection(db, 'attendance'),
        where('classId', '==', classDoc.id),
        where('date', '==', todayStr)
      );
      const attSnap = await getDocs(attCheckQuery);
      classData.attendanceStatus = attSnap.empty ? 'Pending' : 'Completed';

      assignedClasses.push(classData);
    }

    callback(assignedClasses);
  });
};

/**
 * 3. STUDENT DASHBOARD LIVE DATA
 */
export const subscribeStudentOverview = (studentUid, callback) => {
  const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', studentUid));
  const marksQuery = query(collection(db, 'marks'), where('studentId', '==', studentUid));
  const announcementsRef = collection(db, 'announcements');

  const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
    let present = 0;
    const total = snapshot.size;

    snapshot.docs.forEach((doc) => {
      if (doc.data().status === 'present') present++;
    });

    const rate = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : '100%';
    callback((prev) => ({ ...prev, attendanceRate: rate }));
  });

  const unsubMarks = onSnapshot(marksQuery, (snapshot) => {
    let totalGpaPoints = 0;
    const count = snapshot.size;

    snapshot.docs.forEach((doc) => {
      totalGpaPoints += Number(doc.data().gpa || 0);
    });

    const avgGpa = count > 0 ? (totalGpaPoints / count).toFixed(2) + ' / 4.0' : 'N/A';
    callback((prev) => ({ ...prev, currentGpa: avgGpa }));
  });

  const unsubAnnouncements = onSnapshot(announcementsRef, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback((prev) => ({ ...prev, announcements: list }));
  });

  return () => {
    unsubAttendance();
    unsubMarks();
    unsubAnnouncements();
  };
};