import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Sparkles, Compass, FileText, FileCheck, BarChart3, BookMarked, Newspaper, GraduationCap, MessageSquare, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Badge, Button } from '../ui';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-neutral-800/80 bg-neutral-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-neutral-950 font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-neutral-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-amber-300 transition-colors">
                APPSC Prep
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                v2.0
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-normal">
              ఆంధ్రప్రదేశ్ పబ్లిక్ సర్వీస్ కమిషన్
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden xl:flex items-center gap-1">
          <Link
            to="/courses"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-neutral-400" />
            Catalog
          </Link>

          <Link
            to="/current-affairs"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
          >
            <Newspaper className="w-3.5 h-3.5 text-amber-400" />
            Current Affairs
          </Link>

          <Link
            to="/student/books/appsc-history"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-400" />
            Bilingual Reader
          </Link>

          <Link
            to="/student/tests"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5 text-sky-400" />
            Mock Tests
          </Link>

          <Link
            to="/mentors"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            Mentors
          </Link>

          <Link
            to="/chat"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            Doubt Chat
          </Link>

          <Link
            to="/student/analytics"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            Analytics
          </Link>

          <Link
            to="/admin/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-amber-300/90 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Admin
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/student/dashboard"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                My Courses
              </Link>
            </>
          )}
        </nav>

        {/* Right CTA / Auth Status */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-neutral-800">
                <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300 border border-neutral-700/60">
                  {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-neutral-200 truncate max-w-[120px]">
                    {user?.fullName || user?.email}
                  </span>
                  <Badge variant={user?.role === 'ADMIN' ? 'danger' : 'accent'} size="sm" className="w-fit">
                    {user?.role}
                  </Badge>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                icon={LogOut}
                onClick={handleLogout}
                className="text-neutral-400 hover:text-red-400"
              >
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
