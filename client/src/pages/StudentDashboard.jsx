import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import {
  UserCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  BarChart3,
  Search,
  Loader2,
  Clock
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudentStats = async () => {
    if (!user?._id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/attendance/student/${user._id}`);
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentStats();
  }, [user]);

  const filteredHistory = stats?.history?.filter(
    (item) =>
      item.dateStr.includes(searchQuery) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.remarks.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarLayout title="Student Attendance Portal" breadcrumbs="Student / Overview">
      {/* Profile Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-forest-700 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-2xl shadow-inner border border-white/30 shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">{user?.name}</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                {user?.team}
              </span>
            </div>
            <p className="text-xs font-mono text-emerald-100 mt-0.5">Roll No: {user?.rollNumber}</p>
            <p className="text-xs text-emerald-100">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-xs font-bold text-white border border-white/20">
          <Clock className="w-4 h-4" />
          <span>Read-Only Attendance Portal</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs font-semibold">Loading your personal attendance records...</p>
        </div>
      ) : (
        stats && (
          <div className="space-y-6">
            {/* Stat Cards Row matching TeamHub design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Weekly Stats */}
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weekly Attendance</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.weekly.percentage}%</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${stats.weekly.percentage}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-500 font-semibold">
                  Mon-Sun ({stats.weekly.startDate} to {stats.weekly.endDate})
                </p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                  <div className="bg-white p-2 rounded-xl border border-emerald-100">
                    <div className="text-[10px] text-slate-400 font-bold">Total</div>
                    <div className="font-bold text-slate-900 mt-0.5">{stats.weekly.total}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100">
                    <div className="text-[10px] text-emerald-700 font-bold">Present</div>
                    <div className="font-bold text-emerald-700 mt-0.5">{stats.weekly.present}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100">
                    <div className="text-[10px] text-rose-700 font-bold">Absent</div>
                    <div className="font-bold text-rose-700 mt-0.5">{stats.weekly.absent}</div>
                  </div>
                </div>
              </div>

              {/* Monthly Stats */}
              <div className="bg-teal-50/80 border border-teal-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Monthly Attendance</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.monthly.percentage}%</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-teal-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{ width: `${stats.monthly.percentage}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-500 font-semibold">Current Month</p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                  <div className="bg-white p-2 rounded-xl border border-teal-100">
                    <div className="text-[10px] text-slate-400 font-bold">Total</div>
                    <div className="font-bold text-slate-900 mt-0.5">{stats.monthly.total}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-teal-100">
                    <div className="text-[10px] text-teal-700 font-bold">Present</div>
                    <div className="font-bold text-teal-700 mt-0.5">{stats.monthly.present}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-teal-100">
                    <div className="text-[10px] text-rose-700 font-bold">Absent</div>
                    <div className="font-bold text-rose-700 mt-0.5">{stats.monthly.absent}</div>
                  </div>
                </div>
              </div>

              {/* Overall Stats */}
              <div className="bg-[#064e3b] text-white rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Overall Rate</p>
                    <h3 className="text-3xl font-black text-white mt-1">{stats.overall.percentage}%</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs">
                    <UserCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-emerald-900 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${stats.overall.percentage}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-emerald-200 font-semibold">All Time Performance</p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 text-slate-900">
                  <div className="bg-white p-2 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-bold">Total</div>
                    <div className="font-bold text-slate-900 mt-0.5">{stats.overall.total}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl">
                    <div className="text-[10px] text-emerald-700 font-bold">Present</div>
                    <div className="font-bold text-emerald-700 mt-0.5">{stats.overall.present}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl">
                    <div className="text-[10px] text-rose-700 font-bold">Absent</div>
                    <div className="font-bold text-rose-700 mt-0.5">{stats.overall.absent}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Log Table */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">
                  Daily Attendance Logs ({stats.history.length})
                </h3>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by date or status..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-xs"
                  />
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-500 text-xs">
                  No matching attendance logs found.
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                          <th className="py-4 px-6">S.No</th>
                          <th className="py-4 px-6">Session Date</th>
                          <th className="py-4 px-6">Team</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Remarks / Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredHistory.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-4 px-6 font-mono text-xs text-slate-400">{idx + 1}</td>
                            <td className="py-4 px-6 font-bold font-mono text-slate-900">{item.dateStr}</td>
                            <td className="py-4 px-6">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {item.team}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                                  item.status === 'Present'
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'bg-[#064e3b] text-white'
                                }`}
                              >
                                {item.status === 'Present' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-500">
                              {item.remarks || 'Standard Session'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </SidebarLayout>
  );
};

export default StudentDashboard;
