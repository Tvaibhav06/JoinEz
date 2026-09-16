import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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
        <div className="h-28 bg-slate-200 rounded-xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Workspace Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/70">
              <ShieldCheck className="w-3 h-3 mr-1 inline-block" />
              Faculty Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 max-w-xl">
            Monitor course assignments, configure external OneDrive submission folders, and inspect real-time team completion data.
          </p>
        </div>
        <div className="flex items-center space-x-2.5 shrink-0">
          <Link
            to="/admin/assignments"
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors btn-press shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Post New Assignment
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Registered Students</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums font-mono">
              {summary?.total_students || 0}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Teams</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums font-mono">
              {summary?.total_groups || 0}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assignments Posted</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums font-mono">
              {summary?.total_assignments || 0}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Completion</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums font-mono">
              {summary?.overall_completion_percentage || 0}%
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/admin/assignments"
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 card-hover flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Manage Coursework</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Create and edit coursework, configure external OneDrive folders, and target specific student groups.
            </p>
          </div>
          <div className="pt-3.5 flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            <span>View assignments</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>

        <Link
          to="/admin/monitoring"
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 card-hover flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Live Submission Tracking</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Track submission confirmations group-wise and student-wise with live status indicators.
            </p>
          </div>
          <div className="pt-3.5 flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            <span>Inspect submissions</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 card-hover flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Completion Analytics</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Review completion rates, expected vs confirmed figures, and group-by-group performance rankings.
            </p>
          </div>
          <div className="pt-3.5 flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            <span>Open analytics</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>
      </div>

      {/* Recent Submissions Feed */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Recent Student Confirmations</h2>
            </div>
          </div>
          <Link
            to="/admin/monitoring"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View all
          </Link>
        </div>

        {(!summary?.recent_submissions || summary.recent_submissions.length === 0) ? (
          <p className="text-xs text-slate-500 py-4 text-center">No confirmations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-2.5 pl-2">Student</th>
                  <th className="pb-2.5">Team</th>
                  <th className="pb-2.5">Assignment</th>
                  <th className="pb-2.5 pr-2">Confirmation Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recent_submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-2">
                      <span className="font-semibold text-slate-800 block">{sub.student_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{sub.student_email}</span>
                    </td>
                    <td className="py-2.5 text-slate-600 font-medium">{sub.group_name}</td>
                    <td className="py-2.5 text-slate-800 font-medium">{sub.assignment_title}</td>
                    <td className="py-2.5 pr-2 text-slate-500 tabular-nums">
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

