import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from '../../components/ProgressBar';
import {
  BookOpen,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [taughtCourses, setTaughtCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [summaryRes, coursesRes] = await Promise.all([
        api.getAdminDashboardSummary(),
        api.getTeachingCourses()
      ]);
      setSummary(summaryRes.data);
      setTaughtCourses(coursesRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load professor dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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
        <div className="h-64 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Faculty Executive Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/70 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Faculty Portal • Course Director
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 max-w-xl">
            Inspect course enrollment rosters, monitor individual and team submission confirmations, and post assignments.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <Link
            to="/admin/assignments"
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors btn-press shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Manage Assignments
          </Link>
          <Link
            to="/admin/monitoring"
            className="inline-flex items-center px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold text-xs transition-colors btn-press shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Live Monitoring
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
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Taught Courses</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums font-mono">
              {taughtCourses.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

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
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student Teams</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums font-mono">
              {summary?.total_groups || 0}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Completion</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums font-mono">
              {summary?.overall_completion_percentage || 0}%
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Courses Taught Section with Live PostgreSQL Analytics */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
              Courses Taught & Submission Analytics
            </h2>
            <p className="text-xs text-slate-500">
              Live submission-status breakdown and student counts per course.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {taughtCourses.length} {taughtCourses.length === 1 ? 'Course' : 'Courses'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {taughtCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                    Course #{course.id}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {course.assignments_count} {course.assignments_count === 1 ? 'Assignment' : 'Assignments'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {course.description || 'Academic course curriculum'}
                </p>
              </div>

              {/* PostgreSQL Submission Analytics Panel */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-white border border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Students</span>
                    <strong className="text-sm font-bold text-slate-800 font-mono">{course.student_count}</strong>
                  </div>
                  <div className="p-2 rounded bg-emerald-50/70 border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 block uppercase font-medium">Submitted</span>
                    <strong className="text-sm font-bold text-emerald-700 font-mono">{course.submitted_count}</strong>
                  </div>
                  <div className="p-2 rounded bg-amber-50/70 border border-amber-100">
                    <span className="text-[10px] text-amber-700 block uppercase font-medium">Pending</span>
                    <strong className="text-sm font-bold text-amber-700 font-mono">{course.pending_count}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Course Submission Rate</span>
                    <span className="font-mono tabular-nums">{course.completion_percentage}%</span>
                  </div>
                  <ProgressBar
                    progress={course.completion_percentage}
                    size="sm"
                    color={course.completion_percentage === 100 ? 'emerald' : 'indigo'}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <Link
                  to={`/admin/monitoring`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  Inspect Monitoring
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
                <Link
                  to={`/admin/assignments`}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-slate-500" />
            Recent Submission Activity
          </h3>
          <Link to="/admin/monitoring" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
            View All
          </Link>
        </div>

        {summary?.recent_submissions?.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No confirmations recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {summary?.recent_submissions?.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800">
                    {s.student_name}{' '}
                    <span className="text-slate-400 font-normal">
                      • {s.group_name} {s.course_title && `(${s.course_title})`}
                    </span>
                  </p>
                  <p className="text-slate-500 text-[11px]">{s.assignment_title}</p>
                </div>
                <div className="text-right">
                  {s.confirmed_by_leader_id ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Confirmed by Leader
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Individual
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(s.confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
