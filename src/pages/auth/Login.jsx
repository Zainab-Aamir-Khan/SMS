// src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Lock, Mail, Eye, EyeOff, Loader2, Sparkles, 
  GraduationCap, BookOpen, Users, ShieldCheck, ArrowRight, X 
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth(); 

  useEffect(() => {
    if (user && user.role) {
      toast.success(`Welcome back, ${user.name || 'User'}!`);
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalLoading(true);

    const typedEmail = email.trim().toLowerCase();

    try {
      await signInWithEmailAndPassword(auth, typedEmail, password);
    } catch (err) {
      console.error("Operational catch branch active:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password credentials.');
      } else {
        toast.error('Authentication server error. Please try again.');
      }
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 🚀 Navbar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 border border-indigo-400/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-none">NSES</h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Education Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="#about" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">
              About System
            </a>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 🌟 Hero Section with Student Management Quote */}
      <section className="flex-1 max-w-7xl mx-auto px-6 py-20 lg:py-28 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Student Management System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Empowering Education, <br />
          <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Simplifying Management.
          </span>
        </h1>

        {/* Perfect Quote Card */}
        <blockquote className="max-w-2xl mx-auto my-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative">
          <span className="absolute top-2 left-4 text-4xl text-indigo-500/20 font-serif">“</span>
          <p className="text-slate-300 text-base sm:text-lg italic font-medium relative z-10">
            "An investment in knowledge pays the best interest. Streamlining student success starts with seamless organization and real-time tracking."
          </p>
          <span className="block mt-2 text-xs font-semibold tracking-wider text-indigo-400 uppercase">
            — National Standard Education System Philosophy
          </span>
        </blockquote>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-8.5 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 transition-all cursor-pointer active:scale-95 flex items-center gap-2.5"
          >
            <span>Access Portal Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 📘 About Section */}
      <section id="about" className="py-24 border-t border-slate-900 bg-slate-950/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">About NSES</h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">Built for modern educational administration</h3>
            <p className="text-sm text-slate-400 mt-2">Designed to bring students, educators, and administrators onto a single unified high-performance platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-sm hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Student Lifecycle</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Efficiently manage admissions, profile tracking, class allocation, and academic status in real time.</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-sm hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Academic Records</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Maintain comprehensive performance evaluations, attendance logs, and institutional directives securely.</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-sm hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Secure & Reliable</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Role-based permission framework ensures that sensitive student and administrative data remains fully protected.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">NSES Portal</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-500">National Standard Education System</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} All rights reserved. Built for institutional excellence.
          </p>
        </div>
      </footer>

      {/* 🔐 Sign In Modal Overlay */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md relative p-[1px] rounded-3xl bg-gradient-to-b from-indigo-500/40 via-slate-800/60 to-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="rounded-[23px] bg-slate-900 p-8 space-y-6 relative">
              
              {/* Close Button */}
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-2">
                <h3 className="text-xl font-bold text-white">Welcome Back</h3>
                <p className="text-xs text-slate-400 mt-1">Sign in with your authorized admin or user account</p>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      placeholder="admin@school.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={localLoading}
                    className="w-full flex justify-center items-center gap-2 rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {localLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      'Sign In to Dashboard'
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;