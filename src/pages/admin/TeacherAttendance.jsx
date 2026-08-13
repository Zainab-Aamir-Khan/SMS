// src/pages/admin/TeacherAttendance.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast'; // 🚀 Added for silent failure alerts
import { Calendar as CalendarIcon, Check, X, Clock, AlertCircle } from 'lucide-react';

// 🚀 Local date string generator to prevent timezone offset bugs
const getLocalDateString = () => {
  const localDate = new Date();
  const offset = localDate.getTimezoneOffset();
  const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

// 🚀 Reusable Table Skeleton Loader
const AttendanceTableSkeleton = () => (
  <tbody className="animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="border-b border-slate-100">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-28 bg-slate-200 rounded-md"></div>
              <div className="h-3 w-36 bg-slate-100 rounded-md"></div>
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

const TeacherAttendance = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const tSnap = await getDocs(tQuery);
        const fetchedTeachers = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeachers(fetchedTeachers);

        const aQuery = query(
          collection(db, 'attendance'),
          where('date', '==', selectedDate),
          where('targetRole', '==', 'teacher')
        );
        const aSnap = await getDocs(aQuery);
        
        const fetchedAttendance = {};
        aSnap.forEach(doc => {
          const data = doc.data();
          fetchedAttendance[data.targetId] = data.status;
        });
        
        setAttendanceMap(fetchedAttendance);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load attendance records.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  const markStatus = async (teacher, status) => {
    const teacherId = teacher.id;
    
    // 🚀 Optimistic UI update for instant feedback
    setAttendanceMap(prev => ({ ...prev, [teacherId]: status }));
    
    try {
      const recordId = `${teacherId}_${selectedDate}`;
      await setDoc(doc(db, 'attendance', recordId), {
        targetId: teacherId,
        targetName: teacher.name || 'Instructor', 
        targetRole: 'teacher',
        date: selectedDate,
        status: status,
        markedBy: user.uid,
        timestamp: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.error("Network issue. Status might not be saved.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teacher Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">Track daily staff presence and availability.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <label htmlFor="attendanceDatePicker" className="text-slate-400 cursor-pointer">
            <CalendarIcon className="h-5 w-5 text-indigo-600" />
          </label>
          <input 
            id="attendanceDatePicker"
            name="attendanceDate"
            type="date" 
            value={selectedDate}
            max={getLocalDateString()} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 cursor-pointer w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher Profile</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Mark Action</th>
              </tr>
            </thead>
            
            {loading ? (
              <AttendanceTableSkeleton />
            ) : teachers.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                    No teachers found in the system to mark attendance.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="bg-white divide-y divide-slate-200">
                {teachers.map((teacher) => {
                  const currentStatus = attendanceMap[teacher.id];
                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* 🚀 Dynamic Profile Avatar Fallback */}
                          {teacher.photoURL ? (
                            <img src={teacher.photoURL} alt="" className="h-10 w-10 rounded-full object-cover shadow-sm border border-slate-100" />
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100 shadow-xs">
                              {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-800">{teacher.name}</div>
                            <div className="text-xs font-medium text-slate-500 mt-0.5">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {currentStatus === 'present' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs"><Check className="h-3.5 w-3.5"/> Present</span>}
                        {currentStatus === 'absent' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 shadow-xs"><X className="h-3.5 w-3.5"/> Absent</span>}
                        {currentStatus === 'late' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-xs"><Clock className="h-3.5 w-3.5"/> Late</span>}
                        {!currentStatus && <span className="text-xs text-slate-400 font-medium italic bg-slate-50 px-3 py-1 rounded-full border border-slate-100 inline-block">Unmarked</span>}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => markStatus(teacher, 'present')}
                            className={`p-2 rounded-xl transition-all border cursor-pointer ${currentStatus === 'present' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'border-slate-200 text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'}`}
                            title="Mark Present"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => markStatus(teacher, 'late')}
                            className={`p-2 rounded-xl transition-all border cursor-pointer ${currentStatus === 'late' ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'border-slate-200 text-slate-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600'}`}
                            title="Mark Late"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => markStatus(teacher, 'absent')}
                            className={`p-2 rounded-xl transition-all border cursor-pointer ${currentStatus === 'absent' ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'}`}
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

export default TeacherAttendance;