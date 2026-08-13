// src/pages/teacher/StudentAttendance.jsx
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast"; 
import { logAuditAction } from "../../utils/auditLogger"; // 🚀 Audit Logging Utility
import { Calendar as CalendarIcon, Check, X, Clock, AlertCircle, BookOpen } from "lucide-react";

// Helper function to get correct local date string (YYYY-MM-DD)
const getLocalDateString = () => {
  const localDate = new Date();
  const offset = localDate.getTimezoneOffset();
  const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split("T")[0];
};

// 🚀 Premium Shimmer Table Skeleton Component for Student Roster
const AttendanceRosterSkeleton = () => (
  <tbody className="animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="border-b border-slate-100">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
              <div className="h-3 w-32 bg-slate-100 rounded-md"></div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 flex justify-center">
          <div className="h-6 w-20 bg-slate-100 rounded-full"></div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-2">
            <div className="h-9 w-9 bg-slate-100 rounded-lg"></div>
            <div className="h-9 w-9 bg-slate-100 rounded-lg"></div>
            <div className="h-9 w-9 bg-slate-100 rounded-lg"></div>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
);

const StudentAttendance = () => {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch Teacher's Assigned Classes for the Dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const q = query(
          collection(db, "classes"),
          where("teacherId", "==", user.uid),
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMyClasses(fetched);
        if (fetched.length > 0) {
          setSelectedClass(fetched[0].id); 
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to fetch assigned classes.");
      }
    };
    if (user?.uid) fetchClasses();
  }, [user]);

  // 2. Fetch Students and their Attendance for the selected class and date
  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!selectedClass) {
        setStudents([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);

      try {
        const sQuery = query(
          collection(db, "users"),
          where("role", "==", "student"),
        );
        const sSnap = await getDocs(sQuery);

        const currentClassObj = myClasses.find((c) => c.id === selectedClass);
        const targetGrade = currentClassObj?.gradeClass || currentClassObj?.className;
        const targetSection = currentClassObj?.section;

        const fetchedStudents = sSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((student) => {
            const studentGrade = student.gradeClass || student.className;
            const matchesClass = !targetGrade || studentGrade === targetGrade;
            const matchesSection = !targetSection || student.section === targetSection;
            return matchesClass && matchesSection;
          });

        setStudents(fetchedStudents);

        const aQuery = query(
          collection(db, "attendance"),
          where("date", "==", selectedDate),
          where("classId", "==", selectedClass),
          where("targetRole", "==", "student"),
        );
        const aSnap = await getDocs(aQuery);

        const fetchedAttendance = {};
        aSnap.forEach((doc) => {
          const data = doc.data();
          fetchedAttendance[data.targetId] = data.status;
        });

        setAttendanceMap(fetchedAttendance);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Roster synchronization fault.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate, myClasses]);

  // 3. Mark Student Status with Subject Name included & Audit Logging
const markStatus = async (student, status) => {
    const studentId = student.id;
    const oldStatus = attendanceMap[studentId] || 'Unmarked';

    // If status is clicked again and is identical, do nothing
    if (oldStatus === status) return;

    // Optimistic UI update
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));

    try {
      const currentClassObj = myClasses.find((c) => c.id === selectedClass);
      const subjectName = currentClassObj?.subjectName || currentClassObj?.className || 'General Course';

      const recordId = `${studentId}_${selectedClass}_${selectedDate}`;
      await setDoc(
        doc(db, "attendance", recordId),
        {
          targetId: studentId,
          targetName: student.name || 'Student',
          targetRole: "student",
          classId: selectedClass,
          subjectName: subjectName, 
          date: selectedDate,
          status: status,
          markedBy: user.uid,
          timestamp: new Date().toISOString(),
        },
        { merge: true },
      );

      // 🚀 Log Attendance Modification with Old and New status
      await logAuditAction(user, 'ATTENDANCE_MODIFIED', {
        studentId: studentId,
        studentName: student.name || 'Student',
        subject: subjectName,
        date: selectedDate,
        oldStatus: oldStatus,
        newStatus: status
      });

    } catch (error) {
      console.error("Failed to save student attendance:", error);
      toast.error("Network synchronization issue.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Student Attendance
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Mark daily presence for your assigned class rosters.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Class Selector Dropdown */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
            <label htmlFor="classSelectDropdown" className="text-emerald-600 cursor-pointer">
              <BookOpen className="h-5 w-5" />
            </label>
            <select
              id="classSelectDropdown"
              name="selectedClass"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 cursor-pointer w-full"
            >
              {myClasses.length === 0 ? (
                <option value="">No Classes Assigned</option>
              ) : (
                myClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.subjectName || cls.className} - {cls.gradeClass || cls.className} {cls.section ? `(Sec ${cls.section})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
            <label htmlFor="attendanceDatePicker" className="text-emerald-600 cursor-pointer">
              <CalendarIcon className="h-5 w-5" />
            </label>
            <input
              id="attendanceDatePicker"
              name="attendanceDate"
              type="date"
              value={selectedDate}
              max={getLocalDateString()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 cursor-pointer w-full"
            />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student Profile
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Current Status
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mark Action
                </th>
              </tr>
            </thead>
            
            {loading ? (
              <AttendanceRosterSkeleton />
            ) : !selectedClass ? (
              <tbody>
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    <BookOpen className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    Please select a class to view the student roster.
                  </td>
                </tr>
              </tbody>
            ) : students.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No students found enrolled in this class/section.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="bg-white divide-y divide-slate-200">
                {students.map((student) => {
                  const currentStatus = attendanceMap[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {student.photoURL ? (
                            <img src={student.photoURL} alt="" className="h-10 w-10 rounded-full object-cover shadow-sm border border-slate-100" />
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm border border-emerald-100 shadow-xs">
                              {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-800">
                              {student.name}
                            </div>
                            <div className="text-xs font-medium text-slate-500 mt-0.5">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {currentStatus === "present" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs">
                            <Check className="h-3.5 w-3.5" /> Present
                          </span>
                        )}
                        {currentStatus === "absent" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 shadow-xs">
                            <X className="h-3.5 w-3.5" /> Absent
                          </span>
                        )}
                        {currentStatus === "late" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-xs">
                            <Clock className="h-3.5 w-3.5" /> Late
                          </span>
                        )}
                        {!currentStatus && (
                          <span className="text-xs text-slate-400 font-medium italic bg-slate-50 px-3 py-1 rounded-full border border-slate-100 inline-block">
                            Unmarked
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => markStatus(student, "present")}
                            className={`p-2 rounded-xl transition-all border cursor-pointer ${currentStatus === "present" ? "bg-emerald-500 border-emerald-500 text-white shadow-md" : "border-slate-200 text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600"}`}
                            title="Mark Present"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => markStatus(student, "late")}
                            className={`p-2 rounded-xl transition-all border cursor-pointer ${currentStatus === "late" ? "bg-amber-500 border-amber-500 text-white shadow-md" : "border-slate-200 text-slate-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600"}`}
                            title="Mark Late"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => markStatus(student, "absent")}
                            className={`p-2 rounded-xl transition-all border cursor-pointer ${currentStatus === "absent" ? "bg-rose-50 border-rose-500 text-white shadow-md" : "border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"}`}
                            title="Mark Absent"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;