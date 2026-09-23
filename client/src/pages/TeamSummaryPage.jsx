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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Performance Analytics</h2>
          <p class="text-xs font-medium text-slate-500 mt-0.5">
            Weekly (Monday–Sunday) and monthly member attendance reports.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Timeframe */}
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Timeframe
            </label>
            <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setRange('week')}
                class={`py-2 rounded-lg text-xs font-bold transition ${
                  range === 'week' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly (Mon-Sun)
              </button>
              <button
                type="button"
                onClick={() => setRange('month')}
                class={`py-2 rounded-lg text-xs font-bold transition ${
                  range === 'month' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Team Scope */}
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Team Scope
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 transition"
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
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reference Date
            </label>
            <input
              type="date"
              value={refDateStr}
              onChange={(e) => setRefDateStr(e.target.value)}
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>
      </div>

      {error && (
        <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div class="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
          <p class="text-xs font-semibold">Generating summary report...</p>
        </div>
      ) : (
        summaryData && (
          <div class="space-y-6">
            {/* Stat Cards */}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Scope</span>
                <h3 class="text-xl font-black text-slate-900 mt-1">{summaryData.selectedTeam}</h3>
                <p class="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5" /> {summaryData.periodName}
                </p>
              </div>

              <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</span>
                <h3 class="text-3xl font-black text-slate-900 mt-1">{summaryData.overallPercentage}%</h3>
                <div class="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <div
                    class="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${summaryData.overallPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sessions Logged</span>
                <h3 class="text-3xl font-black text-slate-900 mt-1">{summaryData.totalSessions}</h3>
                <p class="text-[11px] text-slate-500 mt-2 font-medium">
                  Across {summaryData.totalActiveStudents} active students
                </p>
              </div>

              <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Present vs Absent</span>
                <div class="flex items-center gap-3 mt-1">
                  <div>
                    <span class="text-2xl font-black text-emerald-600">{summaryData.totalPresent}</span>
                    <span class="text-[10px] text-slate-500 block font-bold">Present</span>
                  </div>
                  <div class="text-slate-300 font-light text-xl">/</div>
                  <div>
                    <span class="text-2xl font-black text-rose-600">{summaryData.totalAbsent}</span>
                    <span class="text-[10px] text-slate-500 block font-bold">Absent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Teams Breakdown Grid */}
            {!selectedTeam && (
              <div class="space-y-4">
                <h3 class="text-base font-bold text-slate-900">Team Performance Comparison</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {summaryData.teamsBreakdown.map((tb) => (
                    <div key={tb.team} class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-900 text-sm">{tb.team}</span>
                        <span class="text-xs font-black text-emerald-600">{tb.percentage}%</span>
                      </div>

                      <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          class="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${tb.percentage}%` }}
                        ></div>
                      </div>

                      <div class="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                        <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div class="text-[10px] text-slate-400 font-bold">Members</div>
                          <div class="font-bold text-slate-900 mt-0.5">{tb.totalStudents}</div>
                        </div>
                        <div class="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                          <div class="text-[10px] text-emerald-700 font-bold">Present</div>
                          <div class="font-bold text-emerald-700 mt-0.5">{tb.present}</div>
                        </div>
                        <div class="bg-rose-50 p-2 rounded-xl border border-rose-100">
                          <div class="text-[10px] text-rose-700 font-bold">Absent</div>
                          <div class="font-bold text-rose-700 mt-0.5">{tb.absent}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Leaderboard Table */}
            <div class="space-y-4">
              <h3 class="text-base font-bold text-slate-900">
                Student Member Breakdown ({summaryData.studentSummaries.length})
              </h3>

              <div class="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th class="py-4 px-6">Rank</th>
                        <th class="py-4 px-6">Roll Number</th>
                        <th class="py-4 px-6">Student Name</th>
                        <th class="py-4 px-6">Team</th>
                        <th class="py-4 px-6 text-center">Sessions</th>
                        <th class="py-4 px-6 text-center">Present</th>
                        <th class="py-4 px-6 text-center">Absent</th>
                        <th class="py-4 px-6">Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm">
                      {summaryData.studentSummaries.map((st, idx) => (
                        <tr key={st.studentId} class="hover:bg-slate-50/80 transition">
                          <td class="py-4 px-6 font-bold text-slate-400">#{idx + 1}</td>
                          <td class="py-4 px-6 font-bold font-mono text-emerald-600">{st.rollNumber}</td>
                          <td class="py-4 px-6 font-bold text-slate-900">{st.name}</td>
                          <td class="py-4 px-6">
                            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {st.team}
                            </span>
                          </td>
                          <td class="py-4 px-6 text-center font-bold text-slate-700">{st.total}</td>
                          <td class="py-4 px-6 text-center font-bold text-emerald-600">{st.present}</td>
                          <td class="py-4 px-6 text-center font-bold text-rose-600">{st.absent}</td>
                          <td class="py-4 px-6 min-w-[180px]">
                            <div class="flex items-center gap-3">
                              <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  class={`h-full rounded-full ${
                                    st.percentage >= 85
                                      ? 'bg-emerald-500'
                                      : st.percentage >= 70
                                      ? 'bg-teal-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${st.percentage}%` }}
                                ></div>
                              </div>
                              <span class="font-extrabold text-xs text-slate-900 shrink-0">{st.percentage}%</span>
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
