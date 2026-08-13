// src/pages/admin/AdminExamSchedulesView.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-hot-toast';
import { logAuditAction } from '../../utils/auditLogger';
import { Calendar, BookOpen, Award, Plus, Trash2, Edit2, Clock, AlertCircle, Loader2, X } from 'lucide-react';

const AdminExamSchedulesView = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);

  const [formData, setFormData] = useState({
    title: 'Mid-1',
    maxMarks: '100',
    dueDate: ''
  });

  // Fetch all classes in the system
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClasses(fetched);
        if (fetched.length > 0) setSelectedClassId(fetched[0].id);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load school classes.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch scheduled exams for selected class
  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedClassId) {
        setExams([]);
        return;
      }
      try {
        const q = query(collection(db, 'exams'), where('classId', '==', selectedClassId));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExams(fetched);
      } catch (error) {
        console.error("Error fetching exams:", error);
      }
    };
    fetchExams();
  }, [selectedClassId]);

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!formData.dueDate) {
      toast.error("Please select a valid due date and time.");
      return;
    }

    setSubmitting(true);
    try {
      const activeClass = classes.find(c => c.id === selectedClassId);
      const subjectName = activeClass?.subjectName || activeClass?.className || 'General Course';

      if (editingExamId) {
        // Update existing exam
        const examRef = doc(db, 'exams', editingExamId);
        await updateDoc(examRef, {
          title: formData.title,
          maxMarks: parseInt(formData.maxMarks),
          dueDate: formData.dueDate
        });

        await logAuditAction({ name: 'Administrator', role: 'admin', uid: 'admin' }, 'EXAM_UPDATED', {
          examId: editingExamId,
          examTitle: formData.title,
          subject: subjectName,
          dueDate: formData.dueDate,
          maxMarks: formData.maxMarks
        });

        setExams(prev => prev.map(e => e.id === editingExamId ? { ...e, ...formData, maxMarks: parseInt(formData.maxMarks) } : e));
        toast.success(`${formData.title} updated successfully!`);
      } else {
        // Create new exam
        const examPayload = {
          classId: selectedClassId,
          teacherId: activeClass?.teacherId || 'Unassigned',
          subject: subjectName,
          title: formData.title,
          maxMarks: parseInt(formData.maxMarks),
          dueDate: formData.dueDate,
          createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'exams'), examPayload);

        await logAuditAction({ name: 'Administrator', role: 'admin', uid: 'admin' }, 'EXAM_SCHEDULED', {
          examTitle: formData.title,
          classId: selectedClassId,
          subject: subjectName,
          dueDate: formData.dueDate,
          maxMarks: formData.maxMarks
        });

        setExams(prev => [...prev, { id: docRef.id, ...examPayload }]);
        toast.success(`${formData.title} scheduled successfully for ${subjectName}!`);
      }

      setEditingExamId(null);
      setFormData({ title: 'Mid-1', maxMarks: '100', dueDate: '' });
    } catch (error) {
      console.error("Error saving exam:", error);
      toast.error("Failed to save exam container.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExam = (exam) => {
    setEditingExamId(exam.id);
    setFormData({
      title: exam.title,
      maxMarks: exam.maxMarks.toString(),
      dueDate: exam.dueDate || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    setFormData({ title: 'Mid-1', maxMarks: '100', dueDate: '' });
  };

  const handleDeleteExam = async (examId, examTitle) => {
    if (!window.confirm(`Are you sure you want to remove ${examTitle}?`)) return;
    try {
      await deleteDoc(doc(db, 'exams', examId));
      setExams(prev => prev.filter(e => e.id !== examId));
      toast.success("Exam schedule removed.");
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error("Failed to delete exam.");
    }
  };

  const selectedClassObj = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Midterms & Final Exam Scheduling</h1>
          <p className="text-slate-500 text-sm mt-1">Configure Mid-1, Mid-2, and Final examinations with exact date and time deadlines.</p>
        </div>

        {/* Class Selector */}
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
          <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
          >
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.gradeClass || cls.className} - {cls.subjectName || cls.className} (Sec {cls.section || 'A'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule / Edit Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              {editingExamId ? 'Edit Examination' : 'Schedule Exam Session'}
            </h2>
            {editingExamId && (
              <button onClick={handleCancelEdit} className="text-xs text-rose-600 font-bold hover:underline cursor-pointer">
                Cancel
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Target Class: <span className="font-bold text-slate-700">{selectedClassObj?.gradeClass || 'Class'} ({selectedClassObj?.subjectName || 'Subject'})</span>
          </p>

          <form onSubmit={handleSaveExam} className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Examination Title</label>
              <select
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="Mid-1">Mid-Term 1 (Mid-1)</option>
                <option value="Mid-2">Mid-Term 2 (Mid-2)</option>
                <option value="Final Exam">Final Examination</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Maximum Scale</label>
              <input
                type="number"
                min="1"
                required
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Instructor grading window locks automatically after this date and time.</p>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedClassId}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:bg-indigo-300"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingExamId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingExamId ? 'Update Examination' : 'Publish Examination'}
            </button>
          </form>
        </div>

        {/* Existing Schedules Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">
            Scheduled Midterms & Finals
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Exam Type</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Max Scale</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Due Deadline (Date & Time)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
                    </td>
                  </tr>
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      No midterms or final exams scheduled for this class yet.
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => {
                    const isPassed = exam.dueDate && new Date() > new Date(exam.dueDate);
                    const formattedDeadline = exam.dueDate ? exam.dueDate.replace('T', ' at ') : 'No Due Date';
                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                          🎯 {exam.title}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-600">
                          {exam.maxMarks} marks
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${isPassed ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            <Clock className="h-3 w-3" /> {formattedDeadline} {isPassed && '(Locked)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEditExam(exam)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                              title="Edit Schedule"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id, exam.title)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Schedule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExamSchedulesView;