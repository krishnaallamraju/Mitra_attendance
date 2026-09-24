import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BarChart3,
  UserCheck,
  LogOut,
  Search,
  Bell,
  Settings,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';

const SidebarLayout = ({ children, title = 'Attendance', breadcrumbs = 'Dashboard / Attendance' }) => {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0 sticky top-0 h-screen z-30 justify-between p-5">
        <div className="space-y-6">
          {/* MITRA Logo Banner from user upload */}
          <Link to={isAdmin ? '/admin-dashboard' : '/student-dashboard'} className="flex items-center gap-3 px-2">
            <img
              src="/mitra-logo.jpg"
              alt="MITRA Logo"
              className="h-12 w-auto object-contain rounded-lg border border-slate-100 shadow-sm"
              onError={(e) => {
                // Fallback styling if logo image fails
                e.target.style.display = 'none';
              }}
            />
            <div className="logo-fallback hidden">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">MITRA</span>
              <span className="block text-[10px] text-slate-500 font-medium">VISHNU TECH</span>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at Sidebar Bottom */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">
                {isAdmin ? 'Administrator' : user?.team || 'Student'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
          {/* Left: Mobile Menu Toggle & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
              <p className="text-xs font-semibold text-emerald-600 -mt-0.5">{breadcrumbs}</p>
            </div>
          </div>

          {/* Right: Search & Profile Quick Actions */}
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="hidden sm:flex items-center relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
              />
            </div>

            {/* User Badge */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 animate-fade-in">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                    active ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs mt-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 px-8 border-t border-slate-200 text-center text-xs text-slate-500">
          MITRA Club Attendance System â€¢ Vishnu Institute of Technology &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
};

export default SidebarLayout;
