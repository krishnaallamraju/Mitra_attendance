import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SidebarLayout from '../components/SidebarLayout';
import {
  Users,
  CheckSquare,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/attendance/admin-dashboard');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <SidebarLayout title="Attendance Dashboard" breadcrumbs="Dashboard / Attendance">
      {/* Top Banner Actions */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Today's Overview</h2>
          <p class="text-xs font-medium text-slate-500 mt-0.5">
            Real-time club attendance metrics & team participation
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            class="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition shadow-xs"
          >
            <RefreshCw class={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>

          <Link
            to="/mark-attendance"
            class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition"
          >
            <CheckSquare class="w-4 h-4" /> Mark Attendance
          </Link>
        </div>
      </div>

      {error && (
        <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div class="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
          <p class="text-xs font-semibold">Loading live metrics...</p>
        </div>
      ) : (
        stats && (
          <div class="space-y-6">
            {/* 4 Stat Cards Row matching TeamHub screenshot */}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* 1. Present Card (Light Mint background) */}
              <div class="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div class="flex items-start justify-between">
                  <span class="text-sm font-bold text-slate-900">Present</span>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                    +4 vs yesterday
                  </span>
                </div>

                <div>
                  <div class="text-4xl font-black text-slate-900 tracking-tight">{stats.todayPresent}</div>
                  <div class="text-xs font-semibold text-slate-500 mt-1">Students On-Time</div>
                </div>

                <div class="pt-3 border-t border-emerald-100/80 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span><strong class="text-slate-900">{stats.todayPresent}</strong> Marked</span>
                  <span><strong class="text-slate-900">{stats.todayPercentage}%</strong> Rate</span>
                </div>
              </div>

              {/* 2. On Leave / Pending Card (Soft Teal background) */}
              <div class="bg-teal-50/80 border border-teal-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div class="flex items-start justify-between">
                  <span class="text-sm font-bold text-slate-900">Pending Roster</span>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 border border-teal-200">
                    Active
                  </span>
                </div>

                <div>
                  <div class="text-4xl font-black text-slate-900 tracking-tight">
                    {stats.totalStudents - stats.todayMarked}
                  </div>
                  <div class="text-xs font-semibold text-slate-500 mt-1">Students Pending Call</div>
                </div>

                <div class="pt-3 border-t border-teal-100/80 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span><strong class="text-slate-900">4</strong> Core Teams</span>
                  <span><strong class="text-slate-900">{stats.totalStudents}</strong> Total</span>
                </div>
              </div>

              {/* 3. Absent Card (Dark Forest Green background matching TeamHub image) */}
              <div class="bg-[#064e3b] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div class="flex items-start justify-between">
                  <span class="text-sm font-bold text-emerald-100">Absent</span>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-800/80 text-emerald-200">
                    Today
                  </span>
                </div>

                <div>
                  <div class="text-4xl font-black text-white tracking-tight">{stats.todayAbsent}</div>
                  <div class="text-xs font-semibold text-emerald-200 mt-1">Absent Students</div>
                </div>

                <div class="pt-3 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-200 font-medium">
                  <span>Logged Today</span>
                  <span class="text-white font-bold">{stats.todayStr}</span>
                </div>
              </div>

              {/* 4. Attendance Overview Bar Visual */}
              <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-slate-900">Weekly Rate</span>
                  <span class="text-xs text-slate-400 font-semibold">Mon - Sun</span>
                </div>

                <div class="space-y-2">
                  <div class="flex justify-between text-xs font-bold">
                    <span class="text-slate-600">Attendance Rate</span>
                    <span class="text-emerald-600">{stats.todayPercentage}%</span>
                  </div>
                  <div class="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.todayPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div class="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2">
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#064e3b]"></span> Absent</span>
                </div>
              </div>
            </div>

            {/* Team Breakdown Section */}
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-slate-900">Core Teams Overview</h3>
                <Link to="/team-summary" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  View Full Summary Report <ArrowUpRight class="w-3.5 h-3.5" />
                </Link>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.teamStats.map((ts) => (
                  <div key={ts.team} class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-slate-900 text-sm">{ts.team}</span>
                      <span
                        class={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ts.isCompleted
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ts.isCompleted ? 'MARKED' : 'PENDING'}
                      </span>
                    </div>

                    <div class="space-y-1">
                      <div class="flex justify-between text-xs font-bold text-slate-600">
                        <span>Attendance Rate</span>
                        <span class="text-slate-900">{ts.percentage}%</span>
                      </div>
                      <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          class="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${ts.percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div class="text-[10px] text-slate-400 font-bold">Total</div>
                        <div class="font-bold text-slate-900 mt-0.5">{ts.totalStudents}</div>
                      </div>
                      <div class="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                        <div class="text-[10px] text-emerald-700 font-bold">Present</div>
                        <div class="font-bold text-emerald-700 mt-0.5">{ts.present}</div>
                      </div>
                      <div class="bg-rose-50 p-2 rounded-xl border border-rose-100">
                        <div class="text-[10px] text-rose-700 font-bold">Absent</div>
                        <div class="font-bold text-rose-700 mt-0.5">{ts.absent}</div>
                      </div>
                    </div>

                    <Link
                      to={`/mark-attendance?team=${encodeURIComponent(ts.team)}`}
                      class="block w-full text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition mt-2"
                    >
                      Mark Roster
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </SidebarLayout>
  );
};

export default AdminDashboard;
