import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import {
  Users,
  FileText,
  CheckCircle2,
  BarChart3,
  Eye,
  PlusCircle,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getAdminDashboardSummary();
      setSummary(res.data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load admin dashboard summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-brand-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-purple-900/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs mb-2">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Professor Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-purple-100 text-sm mt-1 max-w-xl">
            Monitor student groups, post coursework with external OneDrive folders, and inspect real-time completion analytics.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/admin/assignments"
            className="inline-flex items-center px-4 py-2.5 bg-white text-purple-800 hover:bg-purple-50 rounded-xl font-semibold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Post New Assignment
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Students</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.total_students || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Teams</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.total_groups || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignments Posted</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.total_assignments || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Completion</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {summary?.overall_completion_percentage || 0}%
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/assignments"
          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Manage Assignments</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create and edit coursework, specify OneDrive links, and target specific student groups.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-brand-600 group-hover:text-brand-700">
            <span>View all assignments</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          to="/admin/monitoring"
          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Live Monitoring</h3>
            <p className="text-xs text-slate-500 mt-1">
              Track submission confirmations group-wise and student-wise in real time.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
            <span>Inspect submission statuses</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-500 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Analytics & Performance</h3>
            <p className="text-xs text-slate-500 mt-1">
              Review completion figures and comparative group performance across coursework.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-purple-600 group-hover:text-purple-700">
            <span>Open analytics dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>
      </div>

      {/* Recent Submissions Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Student Confirmations</h2>
              <p className="text-xs text-slate-500">Live submission confirmations received</p>
            </div>
          </div>
          <Link
            to="/admin/monitoring"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View all
          </Link>
        </div>

        {(!summary?.recent_submissions || summary.recent_submissions.length === 0) ? (
          <p className="text-xs text-slate-500 py-4 text-center">No submissions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Student</th>
                  <th className="pb-3">Group</th>
                  <th className="pb-3">Assignment</th>
                  <th className="pb-3 pr-2">Confirmation Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recent_submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="py-3 pl-2">
                      <span className="font-semibold text-slate-800">{sub.student_name}</span>
                      <span className="text-[11px] text-slate-400 block">{sub.student_email}</span>
                    </td>
                    <td className="py-3 text-slate-600">{sub.group_name}</td>
                    <td className="py-3 text-slate-800 font-medium">{sub.assignment_title}</td>
                    <td className="py-3 pr-2 text-slate-500">
                      {new Date(sub.confirmed_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
