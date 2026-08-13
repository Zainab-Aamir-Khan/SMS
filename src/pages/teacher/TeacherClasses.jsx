// src/pages/teacher/TeacherClasses.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clock, MapPin, Layers, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // 🚀 Added for production safety catch alerts

// 🚀 Premium Shimmer Card Grid Skeleton Loader
const TeacherClassesSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[276px]">
        <div className="p-6 border-b border-slate-100 flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-xl bg-slate-200"></div>
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-slate-200 rounded-lg"></div>
              <div className="h-6 w-14 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
          <div className="h-6 w-3/4 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="p-6 bg-slate-50 space-y-3.5">
          <div className="h-4 w-full bg-slate-200 rounded-md"></div>
          <div className="h-4 w-5/6 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-2/3 bg-slate-200 rounded-md"></div>
        </div>
      </div>
    ))}
  </div>
);

const TeacherClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const fetchMyClasses = async () => {
      setLoading(true);
      try {
        // Fetch ONLY classes assigned to this specific logged-in teacher
        const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedClasses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setClasses(fetchedClasses);
      } catch (error) {
        console.error("Error fetching assigned classes:", error);
        toast.error("Failed to sync your roster updates from active cluster.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      fetchMyClasses();
    }
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Assigned Classes</h1>
        <p className="text-slate-500 text-sm mt-1">Here is your active teaching roster and schedule.</p>
      </div>

      {/* Loading State Grid */}
      {loading ? (
        <TeacherClassesSkeleton />
      ) : classes.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Classes Assigned</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
            You currently don't have any classes assigned to your profile. Please contact the system administrator.
          </p>
        </div>
      ) : (
        /* Class Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const sortedDays = Array.isArray(cls.days) 
              ? [...cls.days].sort((a, b) => weekDays.indexOf(a) - weekDays.indexOf(b)).join(', ') 
              : cls.days || 'TBA';

            return (
              <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
                
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 border border-emerald-100 shadow-xs">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs">
                        {cls.gradeClass || cls.className || 'Class'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs">
                        <Layers className="h-3.5 w-3.5" />
                        Sec {cls.section || 'A'}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1 tracking-tight">{cls.subjectName || cls.className || 'Unnamed Subject'}</h3>
                </div>

                {/* Card Details */}
                <div className="p-6 bg-slate-50/50 flex-1 space-y-3.5 text-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700">{sortedDays}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-medium">{cls.scheduleTime || '08:30 AM'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-medium">Room: <span className="font-bold text-slate-800">{cls.room || 'TBA'}</span></span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 mt-auto">
                  <Link 
                    to="/teacher/attendance"
                    className="py-2.5 px-4 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl text-center hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-xs"
                  >
                    Attendance
                  </Link>
                  <Link 
                    to="/teacher/assignments"
                    className="py-2.5 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-xl text-center hover:bg-emerald-700 shadow-md transition-colors"
                  >
                    Assignments
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;