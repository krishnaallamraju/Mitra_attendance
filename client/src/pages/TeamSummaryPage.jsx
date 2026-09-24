import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SidebarLayout from '../components/SidebarLayout';
import {
  BarChart3,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Award
} from 'lucide-react';

const TEAMS = ['Vibe Coding', 'AI Team', 'Industry Connect', 'Marketing'];

const TeamSummaryPage = () => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [range, setRange] = useState('week');
  const [refDateStr, setRefDateStr] = useState(new Date().toISOString().split('T')[0]);

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedTeam) params.append('team', selectedTeam);
      params.append('range', range);
      if (refDateStr) params.append('refDateStr', refDateStr);

      const res = await api.get(`/attendance/team-summary?${params.toString()}`);
      setSummaryData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedTeam, range, refDateStr]);

  return (
    <SidebarLayout title="Team Summary" breadcrumbs="Analytics / Team Summary">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Performance Analytics</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Weekly (Mondayâ€“Sunday) and monthly member attendance reports.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Timeframe */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Timeframe
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setRange('week')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  range === 'week' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly (Mon-Sun)
              </button>
              <button
                type="button"
                onClick={() => setRange('month')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  range === 'month' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Team Scope */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Team Scope
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="">All Teams (Aggregate View)</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reference Date
            </label>
            <input
              type="date"
              value={refDateStr}
              onChange={(e) => setRefDateStr(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
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
          <p className="text-xs font-semibold">Generating summary report...</p>
        </div>
      ) : (
        summaryData && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Scope</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{summaryData.selectedTeam}</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {summaryData.periodName}
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{summaryData.overallPercentage}%</h3>
                <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${summaryData.overallPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sessions Logged</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{summaryData.totalSessions}</h3>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Across {summaryData.totalActiveStudents} active students
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present vs Absent</span>
                <div className="flex items-center gap-3 mt-1">
                  <div>
                    <span className="text-2xl font-black text-emerald-600">{summaryData.totalPresent}</span>
                    <span className="text-[10px] text-slate-500 block font-bold">Present</span>
                  </div>
                  <div className="text-slate-300 font-light text-xl">/</div>
                  <div>
                    <span className="text-2xl font-black text-rose-600">{summaryData.totalAbsent}</span>
                    <span className="text-[10px] text-slate-500 block font-bold">Absent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Teams Breakdown Grid */}
            {!selectedTeam && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Team Performance Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {summaryData.teamsBreakdown.map((tb) => (
                    <div key={tb.team} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{tb.team}</span>
                        <span className="text-xs font-black text-emerald-600">{tb.percentage}%</span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${tb.percentage}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">Members</div>
                          <div className="font-bold text-slate-900 mt-0.5">{tb.totalStudents}</div>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                          <div className="text-[10px] text-emerald-700 font-bold">Present</div>
                          <div className="font-bold text-emerald-700 mt-0.5">{tb.present}</div>
                        </div>
                        <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
                          <div className="text-[10px] text-rose-700 font-bold">Absent</div>
                          <div className="font-bold text-rose-700 mt-0.5">{tb.absent}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Leaderboard Table */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Student Member Breakdown ({summaryData.studentSummaries.length})
              </h3>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="py-4 px-6">Rank</th>
                        <th className="py-4 px-6">Roll Number</th>
                        <th className="py-4 px-6">Student Name</th>
                        <th className="py-4 px-6">Team</th>
                        <th className="py-4 px-6 text-center">Sessions</th>
                        <th className="py-4 px-6 text-center">Present</th>
                        <th className="py-4 px-6 text-center">Absent</th>
                        <th className="py-4 px-6">Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {summaryData.studentSummaries.map((st, idx) => (
                        <tr key={st.studentId} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-6 font-bold text-slate-400">#{idx + 1}</td>
                          <td className="py-4 px-6 font-bold font-mono text-emerald-600">{st.rollNumber}</td>
                          <td className="py-4 px-6 font-bold text-slate-900">{st.name}</td>
                          <td className="py-4 px-6">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {st.team}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-slate-700">{st.total}</td>
                          <td className="py-4 px-6 text-center font-bold text-emerald-600">{st.present}</td>
                          <td className="py-4 px-6 text-center font-bold text-rose-600">{st.absent}</td>
                          <td className="py-4 px-6 min-w-[180px]">
                            <div className="flex items-center gap-3">
                              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    st.percentage >= 85
                                      ? 'bg-emerald-500'
                                      : st.percentage >= 70
                                      ? 'bg-teal-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${st.percentage}%` }}
                                ></div>
                              </div>
                              <span className="font-extrabold text-xs text-slate-900 shrink-0">{st.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </SidebarLayout>
  );
};

export default TeamSummaryPage;
