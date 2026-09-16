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
        <div className="h-24 bg-slate-200 rounded-xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 rounded-xl md:col-span-1" />
          <div className="h-48 bg-slate-200 rounded-xl md:col-span-2" />
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
      {/* Workspace Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/70">
              Student Workspace
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 max-w-xl">
            Track coursework, open external OneDrive assignment folders, and record team completion confirmations.
          </p>
        </div>
        <div className="flex items-center space-x-2.5 shrink-0">
          <Link
            to="/student/assignments"
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors btn-press shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            View Assignments
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Group Info & Assignments Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Group Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Team Information</h2>
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
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                    Group Name
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{group.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Lead: {group.creator_name} ({group.creator_email})
                  </p>
                </div>

                {/* Overall Group Progress Bar */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                    Overall Team Completion
                  </span>
                  <ProgressBar
                    value={overallGroupPercentage}
                    confirmed={totalSubmissionsConfirmed}
                    total={totalSubmissionsExpected}
                    label="All course submissions"
                    size="sm"
                  />
                </div>

                {/* Member Roster Preview */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-700 block mb-2">
                    Team Members
                  </span>
                  <div className="space-y-1.5">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate pr-1">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800 truncate">{member.name}</span>
                          {member.id === user?.id && (
                            <span className="text-[10px] text-indigo-600 font-semibold shrink-0">(You)</span>
                          )}
                        </div>
                        {member.is_creator && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70 shrink-0">
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
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">No Active Group</h4>
                <p className="text-[11px] text-slate-500 mb-4 max-w-xs mx-auto">
                  You are not currently enrolled in any group. Create or join a team to collaborate on assignments.
                </p>
                <Link
                  to="/student/group"
                  className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold btn-press shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Create Group
                </Link>
              </div>
            )}
          </div>

          {group && (
            <div className="pt-3.5 border-t border-slate-100 mt-4">
              <Link
                to="/student/group"
                className="w-full flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors btn-press"
              >
                <span>Manage Team & Add Members</span>
                <ArrowRight className="w-3 h-3 ml-1.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Applicable Assignments Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Assigned Coursework</h2>
                </div>
              </div>
              <Badge variant="default" size="sm">
                {assignments.length} Total
              </Badge>
            </div>

            {assignments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No coursework assigned"
                description="There are currently no active assignments visible to you or your team."
              />
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const hasSubmitted = assignment.has_submitted;
                  return (
                    <div
                      key={assignment.id}
                      className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900">{assignment.title}</h4>
                          <Badge
                            variant={assignment.target_summary === 'All Students' ? 'all_students' : 'group'}
                            size="sm"
                          >
                            {assignment.target_summary}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {hasSubmitted ? (
                            <Badge variant="confirmed" size="sm">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              Submitted
                            </Badge>
                          ) : (
                            <Badge variant="pending" size="sm">
                              <Clock className="w-3 h-3 mr-1 text-amber-600" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1 mb-2.5">
                        {assignment.description}
                      </p>

                      {/* Group Progress Bar */}
                      {assignment.group_progress && (
                        <div className="mb-2.5 pt-2 border-t border-slate-200/60">
                          <ProgressBar
                            value={assignment.group_progress.progress_percentage}
                            confirmed={assignment.group_progress.confirmed_members}
                            total={assignment.group_progress.total_members}
                            label="Team Progress"
                            size="sm"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center tabular-nums">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
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
                          className="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          OneDrive Folder
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-slate-100 mt-4">
            <Link
              to="/student/assignments"
              className="w-full flex items-center justify-center px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-lg text-xs font-semibold transition-colors btn-press"
            >
              <span>Manage Submissions & Confirm Status</span>
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

