import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  BarChart3,
  Sparkles,
  Code2,
  BrainCircuit,
  Building2,
  Megaphone,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  const teams = [
    {
      name: 'Vibe Coding',
      desc: 'Building cutting-edge web & software products with speed and creativity.',
      icon: Code2,
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      name: 'AI Team',
      desc: 'Exploring machine learning models, Generative AI, and deep tech solutions.',
      icon: BrainCircuit,
      badge: 'bg-teal-100 text-teal-800 border-teal-200'
    },
    {
      name: 'Industry Connect',
      desc: 'Bridging academia with industry partnerships, hackathons, and corporate mentorship.',
      icon: Building2,
      badge: 'bg-slate-100 text-slate-800 border-slate-200'
    },
    {
      name: 'Marketing',
      desc: 'Managing club branding, content creation, social media outreach, and events.',
      icon: Megaphone,
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Header / Brand Nav */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/mitra-logo.jpg"
            alt="MITRA Logo"
            className="h-12 w-auto object-contain rounded-xl border border-slate-200 bg-white shadow-xs p-1"
          />
          <div>
            <h1 className="font-black text-xl tracking-tight text-slate-900">MITRA Club</h1>
            <p className="text-xs font-semibold text-slate-500">Vishnu Institute of Technology</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Official Attendance Management System
          </div>

          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Streamlined Club Attendance for <span className="text-emerald-600">MITRA</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Track member participation, bulk mark team attendance, compute weekly & monthly performance statistics, and empower members with real-time visibility.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login?role=admin"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Admin Portal
            </Link>
            <Link
              to="/login?role=student"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-extrabold text-sm shadow-xs transition flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Student Portal
            </Link>
          </div>
        </div>

        {/* Core Teams */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-slate-900">Four Core MITRA Teams</h3>
            <p className="text-slate-500 text-xs mt-1 font-medium">Organized attendance tracking across specialized club domains</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teams.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.name}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-md border ${t.badge}`}>
                    {t.name}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
        MITRA Club Attendance System â€¢ Vishnu Institute of Technology &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default LandingPage;
