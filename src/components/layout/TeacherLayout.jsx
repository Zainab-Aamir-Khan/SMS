// src/components/layout/TeacherLayout.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast'; // 🚀 Premium Toast Popups
import imageCompression from 'browser-image-compression'; // 🚀 Added client-side compression
import { 
  Users, CheckSquare, ClipboardList, BookOpen, 
  LogOut, Menu, X, GraduationCap, Megaphone, 
  Key, Eye, EyeOff, Settings, Camera, Loader2, Trash2 
} from 'lucide-react';

const TeacherLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ⚙️ Settings Modal States (Tabs: 'profile' or 'password')
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // 🔐 Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // 🖼️ Profile Picture States
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.photoURL || '');
  const [avatarLoading, setAvatarLoading] = useState(false);

  const displayName = user?.name || 'Instructor';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully.');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // ----------------------------------------------------
  // 🖼️ PROFILE PICTURE SELECT, UPLOAD & REMOVE LOGIC
  // ----------------------------------------------------
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file)); 
  };

  const handleCancelUnsavedSelection = () => {
    setAvatarFile(null); 
    setAvatarPreview(user?.photoURL || ''); 
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      toast.error('Please select a new image first.');
      return;
    }

    setAvatarLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user session.');

      const compressionOptions = {
        maxSizeMB: 0.5, 
        maxWidthOrHeight: 1024, 
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(avatarFile, compressionOptions);

      const fileExtension = avatarFile.name.split('.').pop();
      const storageRef = ref(storage, `avatars/${currentUser.uid}.${fileExtension}`);
      
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await updateProfile(currentUser, { photoURL: downloadURL });

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { photoURL: downloadURL });

      toast.success('Profile picture updated successfully!');
      setTimeout(() => window.location.reload(), 1500); 

    } catch (error) {
      console.error("Avatar upload failed:", error);
      toast.error('Failed to update profile picture.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user?.photoURL) return;
    
    setAvatarLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user session.');

      try {
        const imageRef = ref(storage, currentUser.photoURL);
        await deleteObject(imageRef);
      } catch (storageErr) {
        console.warn("Storage item might already be deleted.", storageErr);
      }

      await updateProfile(currentUser, { photoURL: "" });

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { photoURL: "" });

      toast.success('Profile picture removed successfully!');
      setAvatarPreview('');
      setAvatarFile(null);
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error("Remove avatar failed:", error);
      toast.error('Failed to remove profile picture.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // ----------------------------------------------------
  // 🔐 PASSWORD UPDATE LOGIC
  // ----------------------------------------------------
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user found.');
      }

      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      toast.success('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setIsSettingsModalOpen(false);

    } catch (error) {
      console.error("Password update error:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Incorrect existing password entered.');
      } else {
        toast.error(error.message || 'Failed to update password.');
      }
    } finally {
      setPassLoading(false);
    }
  };

  const menuItems = [
    { name: 'My Classes', path: '/teacher', icon: BookOpen },
    { name: 'Student Attendance', path: '/teacher/attendance', icon: CheckSquare },
    { name: 'Gradebook Portal', path: '/teacher/grades', icon: ClipboardList },
    { name: 'Assignments Hub', path: '/teacher/assignments', icon: Users },
    { name: 'Notice Board', path: '/teacher/announcements', icon: Megaphone },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* 🖥️ Sidebar Component */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-emerald-950 text-emerald-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Header */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4 bg-emerald-950 border-b border-emerald-900/50">
          <div className="flex items-center gap-3 text-white">
            <div className="h-10 w-10 rounded-xl bg-emerald-900/50 border border-emerald-800/60 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide block leading-tight">NSES Portal</span>
              <span className="text-[11px] text-emerald-400/80 font-medium tracking-wide block mt-0.5">National Standard Edu System</span>
            </div>
          </div>
          <button className="lg:hidden text-emerald-400 hover:text-white cursor-pointer" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                    : 'text-emerald-300/60 hover:bg-emerald-900/50 hover:text-emerald-100'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Core Actions */}
        <div className="p-4 shrink-0 border-t border-emerald-900/40 bg-emerald-950 space-y-1">
          <button 
            onClick={() => { setIsSettingsModalOpen(true); setActiveTab('profile'); setSidebarOpen(false); }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-emerald-300/60 hover:bg-emerald-900/50 hover:text-emerald-100 rounded-xl transition-colors cursor-pointer"
          >
            <Settings className="h-5 w-5 shrink-0 text-emerald-400" />
            Account Settings
          </button>

          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Wrapper */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs z-10">
          <button className="p-2 -ml-2 text-slate-600 hover:text-emerald-600 lg:hidden rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 tracking-tight">{displayName}</p>
              <p className="text-[11px] font-bold text-emerald-600 tracking-wider truncate max-w-[160px]">{user?.email}</p>
            </div>
            
            {/* Clickable Header Profile Image Setup */}
            <button onClick={() => { setIsSettingsModalOpen(true); setActiveTab('profile'); }} className="cursor-pointer focus:outline-none">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-xs" />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-sm text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Nested Routes Injection */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 relative">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ⚙️ Account Settings Modal Overlay */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <Settings className="h-5 w-5 text-emerald-600" />
                Account Settings
              </div>
              <button 
                onClick={() => { setIsSettingsModalOpen(false); setAvatarPreview(user?.photoURL || ''); setAvatarFile(null); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'profile' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                Profile Picture
              </button>
              <button 
                onClick={() => setActiveTab('password')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'password' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                Security
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileUpdate} className="space-y-6 flex flex-col items-center">
                  <div className="relative group">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="h-28 w-28 rounded-full object-cover border-4 border-slate-100 shadow-md" />
                    ) : (
                      <div className="h-28 w-28 rounded-full bg-emerald-50 border-4 border-slate-100 shadow-md flex items-center justify-center text-4xl font-bold text-emerald-600 relative overflow-visible">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={handleCancelUnsavedSelection}
                        className="absolute -top-1 -right-1 p-1 bg-white text-slate-400 rounded-full shadow-lg hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors border border-slate-200 z-10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <label className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 cursor-pointer transition-colors border-2 border-white z-10">
                      <Camera className="h-4 w-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                    </label>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={avatarLoading || !avatarFile}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {avatarLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : "Save Profile Picture"}
                  </button>

                  {user?.photoURL && !avatarFile && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      disabled={avatarLoading}
                      className="w-full py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Current Picture
                    </button>
                  )}
                </form>
              )}

              {activeTab === 'password' && (
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Existing Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter existing password"
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-4 pr-10 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                      />
                      <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 cursor-pointer">
                        {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-4 pr-10 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 cursor-pointer">
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-4 pr-10 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                      />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 cursor-pointer">
                        {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passLoading}
                      className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {passLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : "Update Securely"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLayout;