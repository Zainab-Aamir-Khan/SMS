// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // 🚀 Beautiful Global Popups
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminAuditLogsView from './pages/admin/AdminAuditLogsView';

// -------------------------------------------------------------
// 1. LAZY LOADING (Splitting code to make the app lightning fast)
// -------------------------------------------------------------
const Login = lazy(() => import('./pages/auth/Login'));

// Admin Components
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AnalyticsOverview = lazy(() => import('./pages/admin/AnalyticsOverview'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ClassScheduling = lazy(() => import('./pages/admin/ClassScheduling'));
const TeacherAttendance = lazy(() => import('./pages/admin/TeacherAttendance'));
import AdminExamSchedulesView from './pages/admin/AdminExamSchedulesView';
const Announcements = lazy(() => import('./pages/admin/Announcements'));

// Teacher Components
const TeacherLayout = lazy(() => import('./components/layout/TeacherLayout'));
const TeacherClasses = lazy(() => import('./pages/teacher/TeacherClasses'));
const StudentAttendance = lazy(() => import('./pages/teacher/StudentAttendance'));
const GradebookPortal = lazy(() => import('./pages/teacher/GradebookPortal'));
const AssignmentsHub = lazy(() => import('./pages/teacher/AssignmentsHub'));
const TeacherAnnouncementsView = lazy(() => import('./pages/teacher/TeacherAnnouncementsView'));

// Student Components
const StudentLayout = lazy(() => import('./components/layout/StudentLayout'));
const StudentDashboardHome = lazy(() => import('./pages/student/StudentDashboardHome'));
const StudentAttendanceView = lazy(() => import('./pages/student/StudentAttendanceView'));
const StudentGradesView = lazy(() => import('./pages/student/StudentGradesView'));
const StudentAssignmentsView = lazy(() => import('./pages/student/StudentAssignmentsView'));
const StudentAnnouncementsView = lazy(() => import('./pages/student/StudentAnnouncementsView'));


// -------------------------------------------------------------
// 2. ERROR BOUNDARY (Prevents the White Screen of Death)
// -------------------------------------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App Component Crashed:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops! Something went wrong.</h2>
            <p className="text-slate-500 mb-6 text-sm">We encountered an unexpected error. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// -------------------------------------------------------------
// 3. REUSABLE UI COMPONENTS (Loader & 404 Page)
// -------------------------------------------------------------
const GlobalLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
      <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading NSES Portal...</p>
    </div>
  </div>
);

const NotFound404 = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
    <h1 className="text-6xl font-black text-indigo-600 mb-2">404</h1>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h2>
    <p className="text-slate-500 mb-6 max-w-md text-sm">The page you are looking for doesn't exist or has been moved.</p>
    <Link to="/" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
      Return to Home
    </Link>
  </div>
);

// -------------------------------------------------------------
// 4. FOOLPROOF PROTECTED ROUTE
// -------------------------------------------------------------
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) return <GlobalLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;

  return children;
};

// -------------------------------------------------------------
// 5. MAIN APP ENTRY
// -------------------------------------------------------------
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          {/* Global Toaster for beautiful notifications */}
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', background: '#334155', color: '#fff', fontSize: '14px', fontWeight: '500' },
            }} 
          />
          
          <Suspense fallback={<GlobalLoader />}>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* 🔐 Admin Dashboard Flow */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AnalyticsOverview />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="scheduling" element={<ClassScheduling />} /> 
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="logs" element={<AdminAuditLogsView />} />
                <Route path="exams" element={<AdminExamSchedulesView />} />
                <Route path="announcements" element={<Announcements />} />
              </Route>

              {/* 🔐 Teacher Dashboard Flow */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
                <Route index element={<TeacherClasses />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="grades" element={<GradebookPortal />} />
                <Route path="assignments" element={<AssignmentsHub />} />
                <Route path="announcements" element={<TeacherAnnouncementsView />} />
              </Route>

              {/* 🔐 Student Dashboard Flow */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
                <Route index element={<StudentDashboardHome />} />
                <Route path="attendance" element={<StudentAttendanceView />} />
                <Route path="grades" element={<StudentGradesView />} />
                <Route path="assignments" element={<StudentAssignmentsView />} />
                <Route path="announcements" element={<StudentAnnouncementsView />} />
              </Route>

              {/* Default Redirect & 404 Catch-All */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound404 />} />
            </Routes>
          </Suspense>

        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;