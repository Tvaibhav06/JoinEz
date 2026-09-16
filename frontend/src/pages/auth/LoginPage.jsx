import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white shadow-xs mb-4">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to Joineazy
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
          Student, group, and assignment management platform
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Demo Accounts Switcher */}
        <div className="mb-5 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center space-x-1.5 text-slate-700 text-xs font-semibold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Instant Demo Accounts</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('student1@demo.com', 'Student@123')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-lg text-slate-700 text-xs text-left transition-colors flex items-center justify-between btn-press"
            >
              <div className="truncate pr-1">
                <span className="font-semibold block text-slate-800">Aarav</span>
                <span className="text-[10px] text-slate-500">Student • Team Alpha</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">Fill</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('student4@demo.com', 'Student@123')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-lg text-slate-700 text-xs text-left transition-colors flex items-center justify-between btn-press"
            >
              <div className="truncate pr-1">
                <span className="font-semibold block text-slate-800">Diya</span>
                <span className="text-[10px] text-slate-500">Student • Team Beta</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">Fill</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@joineazy.demo', 'Admin@123')}
              className="col-span-1 sm:col-span-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-lg text-slate-700 text-xs text-left transition-colors flex items-center justify-between btn-press"
            >
              <div className="flex items-center space-x-2 truncate pr-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-slate-800">Prof. Sarah Jenkins</span>
                  <span className="text-[10px] text-slate-500 ml-1.5">Admin / Professor</span>
                </div>
              </div>
              <span className="text-[10px] text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded shrink-0">Fill</span>
            </button>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white py-7 px-6 sm:px-8 rounded-xl border border-slate-200/90 shadow-xs">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2 px-4 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors btn-press disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="ml-1.5 w-3.5 h-3.5" />}
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New student?{' '}
              <Link to="/register" className="font-semibold text-slate-900 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

