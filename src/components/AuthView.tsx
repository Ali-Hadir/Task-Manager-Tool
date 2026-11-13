import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { CheckSquare, Lock, User, Shield, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signUp } = useTasks();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Operations Specialist');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === 'login') {
      const res = login(username, password);
      if (!res.success) {
        setError(res.message || 'Invalid credentials.');
      }
    } else {
      const res = await signUp(username, password, name, role);
      if (res.success) {
        setSuccessMsg(res.message);
        setMode('login');
        setPassword('');
      } else {
        setError(res.message);
      }
    }
    setLoading(false);
  };

  const fillQuickDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
          TaskFlow Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Dedicated operational checklist hub with role-based access & approval
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          {/* Segmented Auth Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up (Register)
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 leading-relaxed">
              <CheckSquare className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name *
                  </label>
                  <div className="mt-1 relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Job Title / Department
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      placeholder="e.g. Finance Auditor, Logistics Lead"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-500 bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Username *
              </label>
              <div className="mt-1 relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. alex or admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-500 bg-white"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <p className="text-[11px] text-slate-500 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                Note: Upon registration, your request will be in <strong>pending</strong> state until the administrator reviews and approves your account credentials.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <span>{mode === 'login' ? 'Sign In to TaskFlow' : 'Submit Registration for Approval'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Demo Credentials (Click to fill):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickDemo('admin', 'admin123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-600" />
                  Admin
                </div>
                <div className="text-[10px] text-slate-500 font-mono">admin / admin123</div>
                <div className="text-[10px] text-indigo-600 mt-0.5">Full team view & credentials</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('alex', 'alex123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-600" />
                  Member (Alex)
                </div>
                <div className="text-[10px] text-slate-500 font-mono">alex / alex123</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sees own checklist only</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('sarah', 'sarah123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-600" />
                  Member (Sarah)
                </div>
                <div className="text-[10px] text-slate-500 font-mono">sarah / sarah123</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sees own checklist only</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('david', 'david123')}
                className="p-2 text-left rounded-lg border border-amber-200 hover:border-amber-300 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <div className="font-bold text-amber-900 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Pending User
                </div>
                <div className="text-[10px] text-slate-500 font-mono">david / david123</div>
                <div className="text-[10px] text-amber-700 mt-0.5">Requires admin approval</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
