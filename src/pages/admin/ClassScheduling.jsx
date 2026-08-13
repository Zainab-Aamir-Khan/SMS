// src/pages/admin/ClassScheduling.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-hot-toast'; // 🚀 Premium Toast Notifications
import { Plus, BookOpen, Clock, User, MapPin, Trash2, Edit2, X, Calendar, Loader2 } from 'lucide-react';

// 🚀 Premium Card Grid Skeleton Loader
const ClassCardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[240px]">
        <div className="p-6 border-b border-slate-100 flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-slate-200"></div>
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-slate-200 rounded-lg"></div>
              <div className="h-6 w-12 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
          <div className="h-6 w-3/4 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="p-6 bg-slate-50 space-y-3">
          <div className="h-4 w-full bg-slate-200 rounded-md"></div>
          <div className="h-4 w-5/6 bg-slate-200 rounded-md"></div>
        </div>
      </div>
    ))}
  </div>
);

const ClassScheduling = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    gradeClass: 'Class 8',
    subjectName: '',
    section: 'A',
    room: '',
    teacherId: '',
    days: ['Mon', 'Wed', 'Fri'],
    scheduleTime: '08:30 AM'
  });

  const schoolGrades = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  const sections = ['A', 'B', 'C', 'D'];
  
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const cSnap = await getDocs(collection(db, 'classes'));
      const fetchedClasses = cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(fetchedClasses);

      const tQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const tSnap = await getDocs(tQuery);
      const fetchedTeachers = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(fetchedTeachers);

      if (fetchedTeachers.length > 0 && !formData.teacherId) {
        setFormData(prev => ({ ...prev, teacherId: fetchedTeachers[0].id }));
      }
    } catch (error) {
      console.error("Error loading scheduling data:", error);
      toast.error("Failed to load class schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      gradeClass: 'Class 8',
      subjectName: '',
      section: 'A',
      room: '',
      teacherId: teachers[0]?.id || '',
      days: ['Mon', 'Wed', 'Fri'],
      scheduleTime: '08:30 AM'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cls) => {
    setEditingId(cls.id);
    setFormData({
      gradeClass: cls.gradeClass || cls.className || 'Class 8',
      subjectName: cls.subjectName || cls.className || '',
      section: cls.section || 'A',
      room: cls.room || '',
      teacherId: cls.teacherId || '',
      days: Array.isArray(cls.days) 
        ? [...cls.days].sort((a, b) => weekDays.indexOf(a) - weekDays.indexOf(b)) 
        : ['Mon'],
      scheduleTime: cls.scheduleTime || '08:30 AM'
    });
    setIsModalOpen(true);
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const exists = prev.days.includes(day);
      if (exists) {
        if (prev.days.length === 1) {
          toast.error("At least one day must be selected.");
          return prev;
        }
        return { ...prev, days: prev.days.filter(d => d !== day) };
      } else {
        const newDays = [...prev.days, day];
        newDays.sort((a, b) => weekDays.indexOf(a) - weekDays.indexOf(b));
        return { ...prev, days: newDays };
      }
    });
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!formData.subjectName.trim()) {
      toast.error("Please enter a subject name.");
      return;
    }
    if (!formData.teacherId) {
      toast.error("Please assign a teacher to this class.");
      return;
    }

    setSubmitLoading(true);
    try {
      const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
      
      const payload = {
        gradeClass: formData.gradeClass,
        subjectName: formData.subjectName.trim(),
        section: formData.section,
        room: formData.room.trim() || 'TBA',
        teacherId: formData.teacherId,
        teacherName: selectedTeacher?.name || 'Assigned Instructor',
        days: formData.days, 
        scheduleTime: formData.scheduleTime,
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'classes', editingId), payload);
        toast.success("Schedule updated successfully!");
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'classes'), payload);
        toast.success("New subject scheduled successfully!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving class schedule:", error);
      toast.error("Failed to save schedule settings.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2.5 p-1">
        <p className="text-xs font-semibold text-slate-200">Are you sure you want to permanently delete this schedule?</p>
        <div className="flex justify-end gap-2 text-[11px]">
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="px-2.5 py-1 bg-slate-600 hover:bg-slate-500 rounded-md font-medium text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await deleteDoc(doc(db, 'classes', id));
                toast.success("Schedule successfully removed.");
                fetchData();
              } catch (err) {
                toast.error("Failed to delete the schedule.");
              }
            }} 
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 rounded-md font-bold text-white transition-colors cursor-pointer"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    ), { duration: 6000, style: { background: '#1e293b' } });
  };

  return (
    <div className="space-y-6 relative animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Class & Subject Scheduling</h1>
          <p className="text-slate-500 text-sm mt-1">Assign subjects, sections, timings, and teachers.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Schedule New Subject
        </button>
      </div>

      {loading ? (
        <ClassCardSkeleton />
      ) : classes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm text-slate-400">
          <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          No class schedules created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
              <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs">
                      {cls.gradeClass || 'Class'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100 shadow-xs">
                      Sec {cls.section || 'A'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{cls.subjectName || cls.className}</h3>
              </div>

              <div className="p-6 bg-slate-50/50 space-y-3 flex-1 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Teacher: <span className="font-semibold text-slate-800">{cls.teacherName || 'TBA'}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {Array.isArray(cls.days) 
                      ? [...cls.days].sort((a, b) => weekDays.indexOf(a) - weekDays.indexOf(b)).join(', ') 
                      : cls.days}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{cls.scheduleTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>Room: <span className="font-semibold text-slate-800">{cls.room || 'TBA'}</span></span>
                </div>
              </div>

              <div className="px-6 py-3 bg-white border-t border-slate-100 flex justify-end gap-2">
                <button 
                  onClick={() => handleOpenEditModal(cls)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                  title="Edit Schedule"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(cls.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete Schedule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Subject Schedule' : 'Schedule New Subject'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gradeClassSelect" className="block text-sm font-semibold text-slate-700 mb-1">Class / Grade</label>
                  <select
                    id="gradeClassSelect"
                    name="gradeClass"
                    value={formData.gradeClass}
                    onChange={(e) => setFormData({ ...formData, gradeClass: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    {schoolGrades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="sectionSelect" className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    id="sectionSelect"
                    name="section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subjectNameInput" className="block text-sm font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  id="subjectNameInput"
                  name="subjectName"
                  type="text"
                  required
                  autoFocus
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  placeholder="e.g. Mathematics, Science, English..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roomNoInput" className="block text-sm font-semibold text-slate-700 mb-1">Room / Lab No.</label>
                  <input
                    id="roomNoInput"
                    name="room"
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    placeholder="e.g. Room 204"
                  />
                </div>
                <div>
                  <label htmlFor="classTimingInput" className="block text-sm font-semibold text-slate-700 mb-1">Class Timing</label>
                  <input
                    id="classTimingInput"
                    name="scheduleTime"
                    type="text"
                    required
                    value={formData.scheduleTime}
                    onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    placeholder="e.g. 08:30 AM"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="teacherSelect" className="block text-sm font-semibold text-slate-700 mb-1">Assign Teacher</label>
                <select
                  id="teacherSelect"
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                >
                  {teachers.length === 0 ? (
                    <option value="">No teachers available in database</option>
                  ) : (
                    teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <span className="block text-sm font-semibold text-slate-700 mb-2">Select Days</span>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => {
                    const isSelected = formData.days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-md border border-indigo-600' 
                            : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || teachers.length === 0}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 shadow-sm flex items-center justify-center gap-2 min-w-[120px] cursor-pointer"
                >
                  {submitLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (editingId ? 'Save Changes' : 'Schedule Subject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassScheduling;