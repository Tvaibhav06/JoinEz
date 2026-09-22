import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ShieldCheck, ArrowRight, AlertCircle, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inline validation checks
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 6;

  const emailError = touched.email && !isEmailValid ? 'Please enter a valid email address.' : '';
  const passwordError = touched.password && !isPasswordValid ? 'Password must be at least 6 characters.' : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!isEmailValid || !isPasswordValid) {
      setErrorMsg('Please address the form validation errors before signing in.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await login(email, password);
      setSuccessMsg(`Welcome, ${user.name}! Redirecting...`);
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setTouched({ email: true, password: true });
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100 mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to JoinEz
        </h1>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Round 2 Course, Group & Assignment Management Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Instant Demo Accounts Switcher */}
        <div className="mb-4 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 text-xs font-semibold mb-2">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Instant Demo Accounts</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Click to prefill</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => fillCredentials('student1@demo.com', 'Student@123')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="truncate pr-1">
                <span className="font-semibold text-xs text-slate-800">Aarav (Leader)</span>
                <span className="text-[10px] text-slate-500 block">Team Alpha</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">Use</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('student2@demo.com', 'Student@123')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="truncate pr-1">
                <span className="font-semibold text-xs text-slate-800">Bhavya (Member)</span>
                <span className="text-[10px] text-slate-500 block">Team Alpha</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">Use</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('student4@demo.com', 'Student@123')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="truncate pr-1">
                <span className="font-semibold text-xs text-slate-800">Diya (Leader)</span>
                <span className="text-[10px] text-slate-500 block">Team Beta</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">Use</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('admin@joineazy.demo', 'Admin@123')}
              className="px-2.5 py-1.5 bg-purple-50/50 hover:bg-purple-100/60 border border-purple-200/80 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="truncate pr-1">
                <span className="font-semibold text-xs text-purple-900 flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1 text-purple-600" />
                  Prof. Jenkins
                </span>
                <span className="text-[10px] text-purple-600 block">Professor / Admin</span>
              </div>
              <span className="text-[10px] text-purple-700 font-bold px-1.5 py-0.5 bg-purple-100 rounded">Use</span>
            </button>
          </div>
        </div>

        {/* Main Login Form Card */}
        <div className="bg-white py-6 px-6 sm:px-8 rounded-xl border border-slate-200/90 shadow-xs">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                {emailError && <span className="text-[11px] text-rose-600 font-medium">{emailError}</span>}
              </div>
              <input
                type="email"
                required
                value={email}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="name@example.com"
                className={`w-full px-3 py-2 border rounded-lg text-xs placeholder-slate-400 focus:outline-none transition-colors ${
                  emailError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {passwordError && <span className="text-[11px] text-rose-600 font-medium">{passwordError}</span>}
              </div>
              <input
                type="password"
                required
                value={password}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••••••"
                className={`w-full px-3 py-2 border rounded-lg text-xs placeholder-slate-400 focus:outline-none transition-colors ${
                  passwordError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2 px-4 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors btn-press disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </>
                )}
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
