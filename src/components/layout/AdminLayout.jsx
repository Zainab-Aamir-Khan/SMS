// src/components/layout/AdminLayout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../firebase/config';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { ShieldAlert } from 'lucide-react';
import { 
  LayoutDashboard, Users, Calendar, ClipboardCheck, Megaphone, 
  LogOut, Menu, X, KeyRound, Eye, EyeOff, Settings, Camera, Loader2, Trash2 
} from 'lucide-react';

const AdminLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  const displayName = user?.name || 'Admin';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully.');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // ----------------------------------------------------
  // 🖼️ PROFILE PICTURE SELECT & UPLOAD LOGIC
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

  // ----------------------------------------------------
  // 🗑️ PROFILE PICTURE REMOVAL LOGIC
  // ----------------------------------------------------
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
      toast.error('New password and confirm password do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Session expired. Please log in again.');

      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      
      toast.success('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setIsSettingsModalOpen(false);

    } catch (error) {
      console.error("Password change failure:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Current password you entered is incorrect.');
      } else {
        toast.error(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setPassLoading(false);
    }
  };

  const navItems = [
    { name: 'Analytics Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Class Scheduling', path: '/admin/scheduling', icon: Calendar },
    { name: 'Teacher Attendance', path: '/admin/attendance', icon: ClipboardCheck },
    { name: 'Audit Logs', path: '/admin/logs', icon: ShieldAlert },
    { name: 'Exam Schedules', path: '/admin/exams', icon: Calendar },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* 📱 Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-40 flex items-center justify-between px-4 border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-base">Admin Portal</span>
          </div>
        </div>
        
        <button onClick={() => { setIsSettingsModalOpen(true); setActiveTab('profile'); }} className="cursor-pointer">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="h-8 w-8 rounded-lg object-cover border border-slate-700 shadow-sm" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200" />
      )}

      {/* 🖥️ Sidebar Component */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col justify-between h-full border-r border-slate-800 shrink-0
        transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-10 w-10 rounded-xl object-cover border-2 border-indigo-500 shadow-md" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-lg tracking-wider border-2 border-indigo-500">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* 🚀 Changed this section to display Email dynamically */}
              <div className="min-w-0">
                <h1 className="text-sm font-bold tracking-tight text-slate-100 truncate max-w-[140px]">{displayName}</h1>
                <p className="text-xs font-medium text-indigo-400 truncate max-w-[140px]">{user?.email}</p>
              </div>

            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-240px)] scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-200' : ''}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 mt-auto bg-slate-900 space-y-1">
          <button
            onClick={() => { setIsSettingsModalOpen(true); setActiveTab('profile'); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Account Settings</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 bg-slate-100 min-w-0 relative">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ⚙️ Account Settings Modal Overlay */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <Settings className="h-5 w-5 text-indigo-600" />
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
                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                Profile Picture
              </button>
              <button 
                onClick={() => setActiveTab('password')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'password' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
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
                      <div className="h-28 w-28 rounded-full bg-indigo-100 border-4 border-slate-100 shadow-md flex items-center justify-center text-4xl font-bold text-indigo-600 relative overflow-visible">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={handleCancelUnsavedSelection}
                        className="absolute -top-1 -right-1 p-1 bg-white text-slate-400 rounded-full shadow-lg hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors border border-slate-200 z-10"
                        title="Discard selected image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 cursor-pointer transition-colors border-2 border-white z-10">
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
                    className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
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
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-4 pr-10 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
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
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-4 pr-10 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
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
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-4 pr-10 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
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
                      className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {passLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing</> : "Update Securely"}
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

export default AdminLayout;