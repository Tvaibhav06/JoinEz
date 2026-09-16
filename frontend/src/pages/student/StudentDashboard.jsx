import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  AlertCircle
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [groupRes, assignRes] = await Promise.all([
        api.getMyGroup(),
        api.getAssignments()
      ]);
      setGroup(groupRes.data);
      setAssignments(assignRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load dashboard data');
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
        <div className="h-24 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 rounded-2xl md:col-span-1" />
          <div className="h-48 bg-slate-200 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  // Calculate overall progress across assignments for the group
  const totalSubmissionsExpected = group ? assignments.length * group.members.length : 0;
  let totalSubmissionsConfirmed = 0;
  if (group) {
    assignments.forEach((a) => {
      if (a.group_progress) {
        totalSubmissionsConfirmed += a.group_progress.confirmed_members;
      }
    });
  }
  const overallGroupPercentage =
    totalSubmissionsExpected > 0
      ? Math.round((totalSubmissionsConfirmed / totalSubmissionsExpected) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-brand-600/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs mb-2">
            Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-brand-100 text-sm mt-1 max-w-xl">
            Coordinate your team submissions, access external OneDrive assignment links, and track group progress in real time.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/student/assignments"
            className="inline-flex items-center px-4 py-2.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl font-semibold text-xs shadow-md transition-all"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            View Assignments
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Group Info & Assignments Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Group Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Current Group</h2>
                  <p className="text-xs text-slate-500">Your collaborative team</p>
                </div>
              </div>
              {group && (
                <Badge variant="student" size="sm">
                  {group.members.length} Members
                </Badge>
              )}
            </div>

            {group ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                    Group Name
                  </span>
                  <h3 className="text-lg font-bold text-slate-800">{group.name}</h3>
                  <p className="text-xs text-slate-500">
                    Created by {group.creator_name} ({group.creator_email})
                  </p>
                </div>

                {/* Overall Group Progress Bar */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    Overall Team Completion
                  </span>
                  <ProgressBar
                    value={overallGroupPercentage}
                    confirmed={totalSubmissionsConfirmed}
                    total={totalSubmissionsExpected}
                    label="All applicable assignments"
                    size="md"
                  />
                </div>

                {/* Member Roster Preview */}
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    Team Members:
                  </span>
                  <div className="space-y-2">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-[10px]">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">{member.name}</span>
                            {member.id === user?.id && (
                              <span className="ml-1 text-[10px] text-brand-600 font-semibold">(You)</span>
                            )}
                          </div>
                        </div>
                        {member.is_creator && (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Creator
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">No Group Joined</h4>
                <p className="text-xs text-slate-500 mb-4">
                  You are not yet a member of any group. Create one to collaborate on group assignments.
                </p>
                <Link
                  to="/student/group"
                  className="inline-flex items-center px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Create a Group
                </Link>
              </div>
            )}
          </div>

          {group && (
            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link
                to="/student/group"
                className="w-full flex items-center justify-center px-3 py-2 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors"
              >
                <span>Manage Team & Add Members</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Applicable Assignments Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Applicable Assignments</h2>
                  <p className="text-xs text-slate-500">
                    Targeted to you directly or through your group
                  </p>
                </div>
              </div>
              <Badge variant="default" size="sm">
                {assignments.length} Available
              </Badge>
            </div>

            {assignments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No assignments posted yet"
                description="Your professors have not published any assignments visible to your current group."
              />
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const hasSubmitted = assignment.has_submitted;
                  return (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-800">{assignment.title}</h4>
                          <Badge
                            variant={assignment.target_summary === 'All Students' ? 'all_students' : 'group'}
                            size="sm"
                          >
                            {assignment.target_summary}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasSubmitted ? (
                            <Badge variant="confirmed" size="sm">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Submitted
                            </Badge>
                          ) : (
                            <Badge variant="pending" size="sm">
                              <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                        {assignment.description}
                      </p>

                      {/* Group Progress Bar */}
                      {assignment.group_progress && (
                        <div className="mb-3 pt-2 border-t border-slate-100">
                          <ProgressBar
                            value={assignment.group_progress.progress_percentage}
                            confirmed={assignment.group_progress.confirmed_members}
                            total={assignment.group_progress.total_members}
                            label="Group Progress"
                            size="sm"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          Due: {new Date(assignment.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>

                        <a
                          href={assignment.onedrive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center font-medium text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          OneDrive Link
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              to="/student/assignments"
              className="w-full flex items-center justify-center px-4 py-2.5 bg-brand-50 hover:bg-brand-100/80 text-brand-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>Go to Full Assignments & Confirmation View</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
