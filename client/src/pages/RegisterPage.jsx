import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, Lock, Mail, User, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const teams = ['Vibe Coding', 'AI Team', 'Industry Connect', 'Marketing'];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '', team: teams[0] });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard');
    } catch (err) {
      setError(err.message || 'Account creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <Link to="/login" class="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition">
        <ArrowLeft class="w-4 h-4" /> Back to Login
      </Link>

      <div class="w-full max-w-md space-y-6">
        <div class="text-center space-y-3">
          <img src="/mitra-logo.jpg" alt="MITRA Logo" class="h-16 w-auto mx-auto object-contain rounded-2xl border border-slate-200 bg-white p-2 shadow-xs" />
          <h1 class="text-2xl font-black tracking-tight">Create your MITRA account</h1>
          <p class="text-xs font-semibold text-slate-500">Your Firebase account keeps your profile and login secure.</p>
        </div>

        <form onSubmit={handleSubmit} class="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          {error && (
            <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full name
            <div class="relative mt-1"><User class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input value={form.name} onChange={updateField('name')} required class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500" placeholder="Your full name" />
            </div>
          </label>

          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Username
            <div class="relative mt-1"><UserPlus class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input value={form.username} onChange={updateField('username')} required pattern="[A-Za-z0-9_]{3,24}" class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500" placeholder="your_username" />
            </div>
          </label>

          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Email address
            <div class="relative mt-1"><Mail class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input type="email" value={form.email} onChange={updateField('email')} required class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500" placeholder="you@example.com" />
            </div>
          </label>

          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Team
            <select value={form.team} onChange={updateField('team')} class="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500">
              {teams.map((team) => <option key={team}>{team}</option>)}
            </select>
          </label>

          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password
            <div class="relative mt-1"><Lock class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input type="password" value={form.password} onChange={updateField('password')} required minLength={6} class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500" placeholder="At least 6 characters" />
            </div>
          </label>

          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm password
            <div class="relative mt-1"><Lock class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input type="password" value={form.confirmPassword} onChange={updateField('confirmPassword')} required minLength={6} class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500" placeholder="Repeat your password" />
            </div>
          </label>

          <button type="submit" disabled={submitting} class="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50">
            {submitting ? <><Loader2 class="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
          </button>
          <p class="text-center text-xs font-semibold text-slate-500">Already registered? <Link to="/login" class="text-emerald-600 hover:text-emerald-700">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;