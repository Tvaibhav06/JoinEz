import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inline validations
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = password === confirmPassword && confirmPassword.length > 0;

  const nameError = touched.name && !isNameValid ? 'Name must be at least 2 characters.' : '';
  const emailError = touched.email && !isEmailValid ? 'Please enter a valid email address.' : '';
  const passwordError = touched.password && !isPasswordValid ? 'Password must be at least 6 characters.' : '';
  const confirmError = touched.confirm && !isConfirmValid ? 'Passwords do not match.' : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      setErrorMsg('Please resolve the errors highlighted below.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password);
      setSuccessMsg('Account created successfully! Redirecting to your student dashboard...');
      setTimeout(() => {
        navigate('/student');
      }, 600);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100 mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Student Account
        </h1>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Collaborate on coursework, form assignment teams, and record completions
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
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

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Full Name
                </label>
                {nameError && <span className="text-[11px] text-rose-600 font-medium">{nameError}</span>}
              </div>
              <input
                type="text"
                required
                value={name}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="e.g. John Doe"
                className={`w-full px-3 py-2 border rounded-lg text-xs placeholder-slate-400 focus:outline-none transition-colors ${
                  nameError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
            </div>

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
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="student@example.com"
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
                  Password <span className="text-slate-400 font-normal">(min. 6 chars)</span>
                </label>
                {passwordError && <span className="text-[11px] text-rose-600 font-medium">{passwordError}</span>}
              </div>
              <input
                type="password"
                required
                value={password}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Confirm Password
                </label>
                {confirmError && <span className="text-[11px] text-rose-600 font-medium">{confirmError}</span>}
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onBlur={() => setTouched((p) => ({ ...p, confirm: true }))}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••••••"
                className={`w-full px-3 py-2 border rounded-lg text-xs placeholder-slate-400 focus:outline-none transition-colors ${
                  confirmError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2 px-4 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors btn-press disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Student Account
                    <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Note: </span>
            Registration is for students. Faculty accounts are provisioned via administration.
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-slate-900 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
