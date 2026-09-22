import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import {
  BookOpen,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Crown
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [group, setGroup] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [coursesRes, groupRes, assignRes] = await Promise.all([
        api.getMyCourses(),
        api.getMyGroup(),
        api.getAssignments()
      ]);
      setCourses(coursesRes.data || []);
      setGroup(groupRes.data);
      setAssignments(assignRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load student dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-64 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  const completedCount = assignments.filter((a) => a.has_submitted).length;
  const pendingCount = assignments.length - completedCount;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/70">
              Student Portal • Round 2
            </span>
            {group?.is_leader && (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Crown className="w-3 h-3 mr-1 text-amber-600" />
                Team Leader
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 max-w-xl">
            Select an enrolled course below to access individual and team coursework, view deadlines, and acknowledge submissions.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link
            to="/student/assignments"
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors btn-press shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            All Assignments
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Enrolled Courses</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums font-mono">
              {courses.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums font-mono">
              {completedCount} <span className="text-xs text-slate-400 font-normal">/ {assignments.length}</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Group</p>
            <h3 className="text-sm font-bold text-slate-900 mt-1 truncate max-w-[150px]">
              {group ? group.name : 'No Group Joined'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {group ? (group.is_leader ? '★ You are Group Leader' : `Leader: ${group.leader_name}`) : 'Join or create a team'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
              Enrolled Courses
            </h2>
            <p className="text-xs text-slate-500">
              Click any course to view its assignments, deadlines, and submission requirements.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
          </span>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            title="No Enrolled Courses Found"
            description="You are currently not enrolled in any academic courses. Please check back later."
            icon={BookOpen}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/student/courses/${course.id}/assignments`)}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                      Course #{course.id}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center">
                      <FileText className="w-3 h-3 mr-1 text-slate-400" />
                      {course.assignment_count} {course.assignment_count === 1 ? 'Assignment' : 'Assignments'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description || 'Comprehensive curriculum covering core concepts and practical coursework.'}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Instructor: <strong className="text-slate-700 font-semibold">{course.professor_name}</strong>
                  </span>

                  <span className="inline-flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    View
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Status Card if available */}
      {group && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Your Team: {group.name}</h3>
                {group.is_leader ? (
                  <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center">
                    <Crown className="w-2.5 h-2.5 mr-1" />
                    You are Group Leader
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Leader: {group.leader_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {group.is_leader
                  ? 'As group leader, you are authorized to confirm group assignments on OneDrive on behalf of your team.'
                  : 'For group assignments, your group leader confirms on OneDrive on behalf of all team members.'}
              </p>
            </div>
            <Link
              to="/student/group"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              Manage Group Roster
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {group.members?.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <p className="font-semibold text-slate-800 truncate">
                    {m.name} {m.id === user?.id && '(You)'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                </div>
                {m.is_leader && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded shrink-0">
                    Leader
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
