import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BarChart3,
  UserCheck,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const navigate = useLocation();
  const routerNavigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    routerNavigate('/login');
  };

  const navItems = isAdmin
    ? [
        { label: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
        { label: 'Mark Attendance', path: '/mark-attendance', icon: CheckSquare },
        { label: 'Manage Students', path: '/manage-students', icon: Users },
        { label: 'Team Summary', path: '/team-summary', icon: BarChart3 }
      ]
    : [
        { label: 'My Attendance', path: '/student-dashboard', icon: UserCheck }
      ];

  const isActive = (path) => navigate.pathname === path;

  return (
    <header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div class="flex items-center gap-3">
            <Link to={isAdmin ? '/admin-dashboard' : '/student-dashboard'} class="flex items-center gap-3 group">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-blue-500 p-0.5 shadow-md group-hover:shadow-sky-500/20 transition-all duration-300">
                <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-sky-400 text-lg tracking-wider">
                  M
                </div>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-xl tracking-tight text-white group-hover:text-sky-400 transition-colors">
                    MITRA
                  </span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-400 border border-sky-800/50">
                    CLUB
                  </span>
                </div>
                <p class="text-[10px] font-medium text-slate-400 -mt-0.5">Vishnu Institute of Technology</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav class="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  class={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon class={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div class="hidden md:flex items-center gap-4">
            <div class="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div class="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-sm shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div class="text-left">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm font-bold text-slate-100 max-w-[140px] truncate">{user.name}</span>
                  <span
                    class={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isAdmin
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isAdmin ? 'ADMIN' : user.team || 'STUDENT'}
                  </span>
                </div>
                <p class="text-xs text-slate-400 truncate max-w-[160px]">{user.rollNumber || user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              class="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 transition-all"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div class="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X class="w-6 h-6" /> : <Menu class="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div class="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <div class="p-3 bg-slate-800/50 rounded-xl mb-3 border border-slate-700/50 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="font-bold text-white text-sm">{user.name}</div>
              <div class="text-xs text-slate-400">{user.email}</div>
              <span class="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                {user.role.toUpperCase()} {user.team ? `• ${user.team}` : ''}
              </span>
            </div>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                class={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-semibold ${
                  active ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon class="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            class="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/50 font-semibold"
          >
            <LogOut class="w-5 h-5" />
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
