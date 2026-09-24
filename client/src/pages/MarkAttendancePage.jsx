import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import SidebarLayout from '../components/SidebarLayout';
import ConfirmModal from '../components/ConfirmModal';
import {
  CheckSquare,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Save,
  Loader2,
  AlertCircle,
  Filter,
  Calendar
} from 'lucide-react';

const TEAMS = ['Vibe Coding', 'AI Team', 'Industry Connect', 'Marketing'];

const MarkAttendancePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTeam = searchParams.get('team') || 'Vibe Coding';
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [selectedTeam, setSelectedTeam] = useState(initialTeam);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [alert, setAlert] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchRoster = async (team, dateStr) => {
    setLoading(true);
    setAlert(null);
    try {
      const res = await api.get(`/attendance/roster?team=${encodeURIComponent(team)}&dateStr=${dateStr}`);
      const items = res.data.roster.map((item) => ({
        ...item,
        status: item.status || 'Present'
      }));
      setRoster(items);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to load roster' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster(selectedTeam, selectedDate);
  }, [selectedTeam, selectedDate]);

  const handleTeamChange = (team) => {
    setSelectedTeam(team);
    setSearchParams({ team, date: selectedDate });
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setSearchParams({ team: selectedTeam, date: newDate });
  };

  const handleStatusChange = (studentId, newStatus) => {
    setRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status: newStatus } : item))
    );
  };

  const handleMarkAll = (status) => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setAlert(null);

    const payload = {
      team: selectedTeam,
      dateStr: selectedDate,
      records: roster.map((item) => ({
        studentId: item.studentId,
        status: item.status,
        remarks: item.remarks || ''
      }))
    };

    try {
      const res = await api.post('/attendance/mark', payload);
      setAlert({ type: 'success', message: res.data.message || 'Attendance saved successfully!' });
      setShowConfirmModal(false);
      await fetchRoster(selectedTeam, selectedDate);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  const filteredRoster = roster.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = roster.filter((r) => r.status === 'Present').length;
  const absentCount = roster.filter((r) => r.status === 'Absent').length;
  const leaveCount = roster.filter((r) => r.status === 'Leave').length;

  return (
    <SidebarLayout title="Mark Attendance" breadcrumbs="Attendance / Mark Roster">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Daily Roll Call</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Select team & date, toggle student statuses, and save attendance.
          </p>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={loading || saving || roster.length === 0}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition disabled:opacity-50 shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Attendance
        </button>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            alert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Team & Date Selector Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Team Pills */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Team
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEAMS.map((team) => (
                <button
                  key={team}
                  type="button"
                  onClick={() => handleTeamChange(team)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                    selectedTeam === team
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Action Controls & Counts */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Users className="w-4 h-4 text-emerald-600" /> Roster: <span className="text-slate-900">{roster.length}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Present (P): <span>{presentCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700">
              <XCircle className="w-4 h-4" /> Absent (A): <span>{absentCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700">
              <Calendar className="w-4 h-4" /> Leave (L): <span>{leaveCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              onClick={() => handleMarkAll('Present')}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> All Present (P)
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('Absent')}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" /> All Absent (A)
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('Leave')}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" /> All Leave (L)
            </button>
          </div>
        </div>
      </div>

      {/* Roster Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search student by name or roll number..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition shadow-xs"
        />
      </div>

      {/* Roster Data Table matching TeamHub image */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs font-semibold">Loading roster for {selectedTeam}...</p>
        </div>
      ) : filteredRoster.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
          <h3 className="text-base font-bold text-slate-900">No active students found</h3>
          <p className="text-xs mt-1">There are no active students matching your query.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-4 px-6">S.No</th>
                  <th className="py-4 px-6">Roll Number</th>
                  <th className="py-4 px-6">Student Name</th>
                  <th className="py-4 px-6">Team</th>
                  <th className="py-4 px-6 text-center">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRoster.map((student, idx) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">{idx + 1}</td>
                    <td className="py-4 px-6 font-bold font-mono text-emerald-600">{student.rollNumber}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{student.name}</span>
                        {/* Status Indicator pill beside name */}
                        {student.status === 'Present' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-white shadow-xs">P</span>
                        )}
                        {student.status === 'Absent' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white shadow-xs">A</span>
                        )}
                        {student.status === 'Leave' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white shadow-xs">L</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{student.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {student.team}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'Present')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 ${
                            student.status === 'Present'
                              ? 'bg-emerald-500 text-white shadow-emerald-500/20 ring-2 ring-emerald-400'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span className="font-black text-[10px]">P</span> Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'Absent')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 ${
                            student.status === 'Absent'
                              ? 'bg-rose-500 text-white shadow-rose-500/20 ring-2 ring-rose-400'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span className="font-black text-[10px]">A</span> Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'Leave')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 ${
                            student.status === 'Leave'
                              ? 'bg-amber-500 text-white shadow-amber-500/20 ring-2 ring-amber-400'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span className="font-black text-[10px]">L</span> Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSaveAttendance}
        title="Save Attendance Submission"
        message={`Are you sure you want to commit attendance for ${selectedTeam} on ${selectedDate}? Present: ${presentCount}, Absent: ${absentCount}.`}
        confirmText="Confirm & Save"
        loading={saving}
      />
    </SidebarLayout>
  );
};

export default MarkAttendancePage;
