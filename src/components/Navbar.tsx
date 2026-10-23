import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, LogOut, User as UserIcon, Lock, Sparkles, Smartphone } from 'lucide-react';

interface NavbarProps {
  currentTab: 'main' | 'admin';
  setCurrentTab: (tab: 'main' | 'admin') => void;
  onOpenApkGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenApkGuide }) => {
  const { user, isAdmin, signInWithGoogle, signOutUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('main')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <CoinsIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-slate-100">Committee Manager</h1>
              <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Private
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Savings Pool & Payout Tracker</p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2">
          
          {/* APK Guide Button */}
          <button
            onClick={onOpenApkGuide}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            title="Android APK Ready Guide"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">APK Ready</span>
          </button>

          {/* Navigation Tabs */}
          <button
            onClick={() => setCurrentTab('main')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentTab === 'main'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Committee Lists
          </button>

          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* User Auth Profile / Login */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-7 h-7 rounded-full object-cover border border-amber-400" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-xs text-slate-300 hidden md:inline max-w-[100px] truncate">{user.email}</span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-slate-200 truncate">{user.displayName || 'Authenticated User'}</p>
                    <p className="text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center space-x-1.5">
                      {isAdmin ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Admin</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">
                          Standard Viewer
                        </span>
                      )}
                    </div>
                  </div>

                  {!isAdmin && (
                    <div className="px-3 py-2 text-[11px] text-slate-400 bg-slate-950/50">
                      <p className="flex items-center space-x-1 text-slate-300 font-medium">
                        <Lock className="w-3 h-3 text-amber-400 inline" />
                        <span>Admin Access</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Admin role is locked strictly to kfmughal79@gmail.com with verified email.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOutUser();
                    }}
                    className="w-full text-left px-3 py-2 text-rose-400 hover:bg-slate-800 flex items-center space-x-2 transition font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

function CoinsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M18 12a6 6 0 1 0 0-12" />
      <path d="M14 18a6 6 0 1 0 0-12" />
    </svg>
  );
}
