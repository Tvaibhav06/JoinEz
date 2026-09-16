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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to Joineazy
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Student, Group & Assignment Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Demo Credentials Widget */}
        <div className="mb-6 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 text-xs shadow-xs">
          <div className="flex items-center space-x-1.5 text-indigo-900 font-semibold mb-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Instant Demo Accounts (1-Click Fill)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('student1@demo.com', 'Student@123')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-100/60 border border-indigo-200 rounded-lg text-slate-700 font-medium text-left transition-colors flex items-center justify-between"
            >
              <span>Aarav (Student, Alpha)</span>
              <span className="text-[10px] text-indigo-600 font-bold">Fill</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('student4@demo.com', 'Student@123')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-100/60 border border-indigo-200 rounded-lg text-slate-700 font-medium text-left transition-colors flex items-center justify-between"
            >
              <span>Diya (Student, Beta)</span>
              <span className="text-[10px] text-indigo-600 font-bold">Fill</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@joineazy.demo', 'Admin@123')}
              className="col-span-1 sm:col-span-2 px-2.5 py-1.5 bg-white hover:bg-indigo-100/60 border border-purple-200 rounded-lg text-slate-700 font-medium text-left transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Prof. Sarah Jenkins (Admin / Professor)</span>
              </div>
              <span className="text-[10px] text-purple-600 font-bold">Fill</span>
            </button>
          </div>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              New student?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
                Register an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
