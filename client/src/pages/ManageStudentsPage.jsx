import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SidebarLayout from '../components/SidebarLayout';
import ConfirmModal from '../components/ConfirmModal';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  KeyRound,
  Trash2,
  Power,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const TEAMS = ['Vibe Coding', 'AI Team', 'Industry Connect', 'Marketing'];

const ManageStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Alerts & Modals
  const [alert, setAlert] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [activeStudent, setActiveStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    team: 'Vibe Coding',
    password: '',
    isActive: true
  });
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedTeamFilter) queryParams.append('team', selectedTeamFilter);
      if (statusFilter) queryParams.append('isActive', statusFilter);

      const res = await api.get(`/students?${queryParams.toString()}`);
      setStudents(res.data.students);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to fetch students' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedTeamFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      rollNumber: '',
      team: 'Vibe Coding',
      password: 'student123',
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.post('/students', formData);
      setAlert({ type: 'success', message: res.data.message || 'Student created successfully!' });
      setShowAddModal(false);
      fetchStudents();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to create student' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEditModal = (student) => {
    setActiveStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      team: student.team,
      isActive: student.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.put(`/students/${activeStudent._id}`, formData);
      setAlert({ type: 'success', message: res.data.message || 'Student updated successfully!' });
      setShowEditModal(false);
      fetchStudents();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update student' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleQuickMark = async (student, newStatus) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await api.post('/attendance/mark', {
        team: student.team,
        dateStr: todayStr,
        records: [{ studentId: student._id, status: newStatus }]
      });
      setStudents((prev) =>
        prev.map((s) => (s._id === student._id ? { ...s, attendanceStatus: newStatus } : s))
      );
      setAlert({ type: 'success', message: `Marked ${student.name} as ${newStatus} (${newStatus === 'Present' ? 'P' : newStatus === 'Absent' ? 'A' : 'L'})` });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update attendance status' });
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      const res = await api.patch(`/students/${student._id}/toggle-status`);
      setAlert({ type: 'success', message: res.data.message });
      fetchStudents();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update status' });
    }
  };

  const handleOpenResetModal = (student) => {
    setActiveStudent(student);
    setResetPasswordVal('student123');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.post(`/students/${activeStudent._id}/reset-password`, {
        newPassword: resetPasswordVal
      });
      setAlert({ type: 'success', message: res.data.message || 'Password reset successfully!' });
      setShowResetModal(false);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to reset password' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeStudent) return;
    setModalLoading(true);
    try {
      const res = await api.delete(`/students/${activeStudent._id}`);
      setAlert({ type: 'success', message: res.data.message || 'Student deleted successfully!' });
      setShowDeleteModal(false);
      fetchStudents();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete student' });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SidebarLayout title="Manage Students" breadcrumbs="Students / Directory">
      {/* Top Banner Actions */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Member Directory</h2>
          <p class="text-xs font-medium text-slate-500 mt-0.5">
            Add new student accounts, assign teams, edit profiles, or manage status.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          class="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition shrink-0"
        >
          <UserPlus class="w-4 h-4" /> Add New Student
        </button>
      </div>

      {alert && (
        <div
          class={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            alert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div class="flex items-center gap-2.5">
            {alert.type === 'success' ? <CheckCircle2 class="w-5 h-5 text-emerald-600" /> : <AlertCircle class="w-5 h-5 text-rose-600" />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} class="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, roll number..."
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <select
          value={selectedTeamFilter}
          onChange={(e) => setSelectedTeamFilter(e.target.value)}
          class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition"
        >
          <option value="">All Core Teams</option>
          {TEAMS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition"
        >
          <option value="">All Statuses (Active & Inactive)</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div class="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
          <p class="text-xs font-semibold">Loading student directory...</p>
        </div>
      ) : students.length === 0 ? (
        <div class="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
          <Users class="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 class="text-base font-bold text-slate-900">No students found</h3>
          <p class="text-xs mt-1">Try broadening your search or filter parameters.</p>
        </div>
      ) : (
        <div class="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th class="py-4 px-6">Roll Number</th>
                  <th class="py-4 px-6">Student Details</th>
                  <th class="py-4 px-6">Team</th>
                  <th class="py-4 px-6">Account Status</th>
                  <th class="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                {students.map((student) => (
                  <tr key={student._id} class="hover:bg-slate-50/80 transition">
                    <td class="py-4 px-6 font-bold font-mono text-emerald-600">{student.rollNumber}</td>
                    <td class="py-4 px-6">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-slate-900">{student.name}</span>
                        
                        {/* Attendance Status Indicators: P in Green, A in Red, L for Leave */}
                        <div class="inline-flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickMark(student, 'Present')}
                            title="Mark Present (P)"
                            class={`px-1.5 py-0.5 rounded text-[11px] font-black transition flex items-center justify-center min-w-[22px] ${
                              student.attendanceStatus === 'Present'
                                ? 'bg-emerald-500 text-white shadow-xs ring-2 ring-emerald-400'
                                : 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            P
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickMark(student, 'Absent')}
                            title="Mark Absent (A)"
                            class={`px-1.5 py-0.5 rounded text-[11px] font-black transition flex items-center justify-center min-w-[22px] ${
                              student.attendanceStatus === 'Absent'
                                ? 'bg-rose-500 text-white shadow-xs ring-2 ring-rose-400'
                                : 'bg-rose-100/80 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            A
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickMark(student, 'Leave')}
                            title="Mark Leave (L)"
                            class={`px-1.5 py-0.5 rounded text-[11px] font-black transition flex items-center justify-center min-w-[22px] ${
                              student.attendanceStatus === 'Leave'
                                ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-400'
                                : 'bg-amber-100/80 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            L
                          </button>
                        </div>
                      </div>
                      <div class="text-xs text-slate-400">{student.email}</div>
                    </td>
                    <td class="py-4 px-6">
                      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {student.team}
                      </span>
                    </td>
                    <td class="py-4 px-6">
                      <span
                        class={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          student.isActive
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {student.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td class="py-4 px-6">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          title="Edit Student"
                          class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <Edit2 class="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(student)}
                          title={student.isActive ? 'Deactivate' : 'Activate'}
                          class={`p-2 rounded-xl transition ${
                            student.isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Power class="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenResetModal(student)}
                          title="Reset Password"
                          class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <KeyRound class="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveStudent(student);
                            setShowDeleteModal(true);
                          }}
                          title="Delete Student"
                          class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                        >
                          <Trash2 class="w-4 h-4" />
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div class="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus class="w-5 h-5 text-emerald-600" /> Register New Student
              </h3>
              <button onClick={() => setShowAddModal(false)} class="text-slate-400 hover:text-slate-600 p-1">
                <X class="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Rahul Sharma"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="21VIT001"
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Team</label>
                  <select
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rahul.vibe@mitra.edu"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="student123"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div class="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  class="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2"
                >
                  {modalLoading && <Loader2 class="w-4 h-4 animate-spin" />} Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div class="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 class="w-5 h-5 text-emerald-600" /> Edit Student Details
              </h3>
              <button onClick={() => setShowEditModal(false)} class="text-slate-400 hover:text-slate-600 p-1">
                <X class="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Team</label>
                  <select
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  class="rounded bg-slate-50 border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="isActiveCheck" class="text-xs font-bold text-slate-700 cursor-pointer">
                  Account Active Status
                </label>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  class="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2"
                >
                  {modalLoading && <Loader2 class="w-4 h-4 animate-spin" />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div class="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound class="w-5 h-5 text-emerald-600" /> Reset Password
              </h3>
              <button onClick={() => setShowResetModal(false)} class="text-slate-400 hover:text-slate-600 p-1">
                <X class="w-5 h-5" />
              </button>
            </div>

            <p class="text-xs text-slate-500">
              Reset password for <strong class="text-slate-900">{activeStudent?.name}</strong> ({activeStudent?.rollNumber}).
            </p>

            <form onSubmit={handleResetPassword} class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="At least 6 characters"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div class="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  class="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2"
                >
                  {modalLoading && <Loader2 class="w-4 h-4 animate-spin" />} Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Student Account"
        message={`Are you sure you want to permanently delete ${activeStudent?.name} (${activeStudent?.rollNumber})?`}
        confirmText="Permanently Delete"
        isDanger={true}
        loading={modalLoading}
      />
    </SidebarLayout>
  );
};

export default ManageStudentsPage;
