// src/pages/student/StudentAssignmentsView.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast'; // 🚀 Premium Toast Notifications
import { 
  Clipboard, Calendar, FileText, Paperclip, UploadCloud, 
  CheckCircle2, AlertCircle, X, Loader2, BookOpen, 
  Link as LinkIcon, MessageSquare, GraduationCap, Layers, Lock 
} from 'lucide-react';

// 🚀 Premium Shimmer Card Grid Skeleton Loader for Assignments
const AssignmentCardsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[250px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 w-full">
              <div className="h-9 w-9 bg-slate-200 rounded-xl shrink-0"></div>
              <div className="h-5 w-2/3 bg-slate-200 rounded-md"></div>
            </div>
            <div className="h-6 w-20 bg-slate-100 rounded-lg shrink-0"></div>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-md"></div>
          <div className="h-3 w-3/4 bg-slate-100 rounded-md"></div>
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
          <div className="h-9 w-28 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    ))}
  </div>
);

const StudentAssignmentsView = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);

  // Submission Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Submission Form Fields
  const [submissionForm, setSubmissionForm] = useState({
    comment: '',
    submissionUrl: ''
  });

  const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'txt'];

  // 🚀 Helper function to check if deadline has passed
  const isDeadlinePassed = (dueDate, dueTime) => {
    if (!dueDate) return false;
    const timeStr = dueTime || '23:59';
    const dueDateTime = new Date(`${dueDate}T${timeStr}`);
    return new Date() > dueDateTime;
  };

  // 1. Fetch Student Profile & Enrolled Classes
  useEffect(() => {
    const fetchStudentClasses = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const studentData = userSnap.exists() ? userSnap.data() : {};
        const studentGrade = studentData.gradeClass || studentData.className;
        const studentSection = studentData.section;

        const snap = await getDocs(collection(db, 'classes'));
        const allClasses = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const enrolledClasses = allClasses.filter(cls => {
          const clsGrade = cls.gradeClass || cls.className;
          const matchGrade = studentGrade ? clsGrade === studentGrade : true;
          const matchSection = studentSection ? cls.section === studentSection : true;
          return matchGrade && matchSection;
        });

        setClasses(enrolledClasses);
        if (enrolledClasses.length > 0) {
          setSelectedClass(enrolledClasses[0].id);
        }
      } catch (error) {
        console.error("Error fetching student classes:", error);
        toast.error("Failed to load enrolled classes.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentClasses();
  }, [user]);

  // 2. Fetch Assignments and Submissions for Selected Class
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass || !user?.uid) return;
      try {
        const aQuery = query(collection(db, 'assignments'), where('classId', '==', selectedClass));
        const aSnap = await getDocs(aQuery);
        let fetchedAssignments = aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedAssignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAssignments(fetchedAssignments);

        const sQuery = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
        const sSnap = await getDocs(sQuery);
        const fetchedSubs = {};
        sSnap.docs.forEach(doc => {
          const data = doc.data();
          fetchedSubs[data.assignmentId] = data;
        });
        setSubmissions(fetchedSubs);
      } catch (error) {
        console.error("Error fetching assignments and submissions:", error);
        toast.error("Failed to sync coursework tasks.");
      }
    };

    fetchData();
  }, [selectedClass, user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      setFileError('Invalid format! Supported: PDF, DOCX, PPTX, XLSX, TXT, ZIP.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError('File size exceeds the 2MB security limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    e.target.value = '';
  };

  const openSubmitModal = (task) => {
    // 🚀 Check deadline before opening modal
    if (isDeadlinePassed(task.dueDate, task.dueTime)) {
      toast.error("Deadline has passed. Submissions and edits are locked.");
      return;
    }

    setActiveTask(task);
    setSelectedFile(null);
    setFileError('');
    const existingSub = submissions[task.id];
    setSubmissionForm({
      comment: existingSub?.comment || '',
      submissionUrl: existingSub?.submissionUrl || ''
    });
    setIsModalOpen(true);
  };

  const closeSubmitModal = () => {
    setIsModalOpen(false);
    setActiveTask(null);
    setSelectedFile(null);
    setFileError('');
    setSubmissionForm({ comment: '', submissionUrl: '' });
  };

  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();
    if (!activeTask) return;

    // 🚀 Strict deadline guard check
    if (isDeadlinePassed(activeTask.dueDate, activeTask.dueTime)) {
      toast.error("The submission deadline has passed. Action denied.");
      closeSubmitModal();
      return;
    }

    setSubmitLoading(true);

    try {
      let fileUrl = '';
      let fileName = '';

      if (selectedFile) {
        fileName = selectedFile.name;
        const storageRef = ref(storage, `submissions/${activeTask.id}/${user.uid}_${Date.now()}_${selectedFile.name}`);
        const uploadSnapshot = await uploadBytes(storageRef, selectedFile);
        fileUrl = await getDownloadURL(uploadSnapshot.ref);
      } else {
        const existing = submissions[activeTask.id];
        fileUrl = existing?.fileUrl || '';
        fileName = existing?.fileName || '';
      }

      const recordPayload = {
        studentId: user.uid,
        studentName: user.name || 'Student',
        assignmentId: activeTask.id,
        assignmentTitle: activeTask.title,
        classId: selectedClass,
        fileUrl,
        fileName,
        comment: submissionForm.comment.trim(),
        submissionUrl: submissionForm.submissionUrl.trim(),
        submittedAt: new Date().toISOString()
      };

      const subDocId = `${user.uid}_${activeTask.id}`;
      await setDoc(doc(db, 'submissions', subDocId), recordPayload, { merge: true });

      setSubmissions(prev => ({ ...prev, [activeTask.id]: recordPayload }));
      closeSubmitModal();
      toast.success("Assignment submitted successfully!");
    } catch (error) {
      console.error("Error uploading assignment solution:", error);
      toast.error("Failed to submit assignment. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hourString, minute] = timeStr.split(':');
    const hour = +hourString % 24;
    return (hour % 12 || 12) + ':' + minute + (hour < 12 ? ' AM' : ' PM');
  };

  return (
    <div className="space-y-6 relative animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assignments Hub</h1>
          <p className="text-slate-500 text-sm mt-1">View active coursework tasks and upload your solutions.</p>
        </div>

        {classes.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
            <BookOpen className="h-4 w-4 text-sky-600 shrink-0" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer w-full"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.subjectName || cls.className} - {cls.gradeClass || cls.className} (Sec {cls.section || 'A'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <AssignmentCardsSkeleton />
      ) : classes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          No enrolled classes found for your profile.
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          No assignments published for this class yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((task) => {
            const mySubmission = submissions[task.id];
            const deadlinePassed = isDeadlinePassed(task.dueDate, task.dueTime);

            return (
              <div key={task.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 shadow-xs">
                        <Clipboard className="h-4 w-4" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{task.title}</h3>
                    </div>

                    {/* 🚀 Dynamic Status Badge including Deadline Passed check */}
                    {mySubmission ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0 shadow-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Submitted
                      </span>
                    ) : deadlinePassed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 shrink-0 shadow-xs">
                        <Lock className="h-3 w-3" /> Closed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shrink-0 shadow-xs">
                        Pending
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">{task.description}</p>
                  
                  {task.attachmentUrl && (
                    <a 
                      href={task.attachmentUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors w-fit max-w-full shadow-xs"
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{task.attachmentName || 'Reference Document'}</span>
                    </a>
                  )}

                  {mySubmission?.comment && (
                    <div className="p-3 bg-sky-50/40 rounded-xl border border-sky-100 text-xs text-slate-600 mt-2">
                      <span className="font-bold text-sky-900 block mb-0.5">Your Notes:</span>
                      {mySubmission.comment}
                    </div>
                  )}

                  {mySubmission?.submissionUrl && (
                    <a 
                      href={mySubmission.submissionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1 mt-1 truncate"
                    >
                      <LinkIcon className="h-3.5 w-3.5 shrink-0" /> {mySubmission.submissionUrl}
                    </a>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-5 space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Max Marks: <span className="text-slate-700">{task.maxMarks}</span></span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                      <Calendar className="h-3.5 w-3.5" /> Due: {task.dueDate} {task.dueTime ? `at ${formatTime(task.dueTime)}` : ''}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    {mySubmission?.fileUrl ? (
                      <a 
                        href={mySubmission.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                      >
                        <Paperclip className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{mySubmission.fileName}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No file attached</span>
                    )}

                    {/* 🚀 Conditional Button Lock if Deadline Passed */}
                    {deadlinePassed ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold shadow-none flex items-center gap-1.5 shrink-0 ml-auto cursor-not-allowed"
                      >
                        <Lock className="h-3.5 w-3.5" /> Deadline Passed
                      </button>
                    ) : (
                      <button
                        onClick={() => openSubmitModal(task)}
                        className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition-colors shadow-sm cursor-pointer ml-auto flex items-center gap-1.5 shrink-0"
                      >
                        <UploadCloud className="h-3.5 w-3.5" /> {mySubmission ? 'Edit Submission' : 'Submit Work'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {isModalOpen && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[90vh] my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">Submit Assignment</h3>
              <button onClick={closeSubmitModal} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFileUploadSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Task</p>
                <h4 className="text-base font-bold text-slate-800 mt-0.5">{activeTask.title}</h4>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-sky-600" /> Submission Notes / Description <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={submissionForm.comment}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, comment: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white resize-none transition-colors"
                  placeholder="Add any comments or notes for your instructor..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <LinkIcon className="h-4 w-4 text-sky-600" /> Reference or Repository URL <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={submissionForm.submissionUrl}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, submissionUrl: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                  placeholder="https://github.com/username/project"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Upload Solution File <span className="text-xs font-normal text-slate-400">(Optional - Max 2MB)</span>
                </label>
                <div className={`mt-1 border-2 border-dashed rounded-xl p-4 text-center transition-all relative ${selectedFile || submissions[activeTask.id]?.fileName ? 'border-sky-500 bg-sky-50/20' : fileError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}>
                  
                  {!selectedFile && (
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                  )}

                  <div className="space-y-1 text-xs">
                    {selectedFile ? (
                      <div className="flex items-center justify-between bg-white px-3 py-2 border border-sky-100 rounded-xl max-w-full z-20 relative shadow-sm">
                        <div className="flex items-center gap-2 truncate text-sky-800 font-semibold pr-2">
                          <Paperclip className="h-4 w-4 text-sky-500 shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-[240px]">{selectedFile.name}</span>
                          <span className="text-[10px] text-sky-500 font-normal shrink-0">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-slate-400 hover:text-rose-600 rounded-lg p-1 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : submissions[activeTask.id]?.fileName ? (
                      <div className="flex items-center justify-between bg-white px-3 py-2 border border-sky-100 rounded-xl max-w-full z-20 relative shadow-sm">
                        <div className="flex items-center gap-2 truncate text-sky-800 font-semibold pr-2">
                          <Paperclip className="h-4 w-4 text-sky-500 shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-[240px]">{submissions[activeTask.id].fileName}</span>
                          <span className="text-[10px] text-sky-500 font-normal shrink-0">(Already Uploaded)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...submissions };
                            if (updated[activeTask.id]) {
                              delete updated[activeTask.id].fileName;
                              delete updated[activeTask.id].fileUrl;
                            }
                            setSubmissions(updated);
                          }}
                          className="text-slate-400 hover:text-rose-600 rounded-lg p-1 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Replace file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                        <p className="font-medium text-slate-600">Click to upload or drag your solution here</p>
                        <p className="text-slate-400 text-[10px]">PDF, Word, Excel, PPT, ZIP up to 2MB</p>
                      </>
                    )}
                  </div>
                </div>
                {fileError && <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">⚠️ {fileError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={closeSubmitModal}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors disabled:bg-sky-300 shadow-sm flex items-center justify-center min-w-[140px] cursor-pointer"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentsView;