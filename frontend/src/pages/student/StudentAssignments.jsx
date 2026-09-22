import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import SubmissionModal from '../../components/SubmissionModal';
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  Check,
  Calendar,
  AlertCircle,
  BookOpen,
  Crown,
  Users,
  UserCheck
} from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'submitted'
  const [activeModalAssignment, setActiveModalAssignment] = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getAssignments();
      setAssignments(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmissionSuccess = () => {
    fetchAssignments();
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'pending') return !a.has_submitted;
    if (filter === 'submitted') return a.has_submitted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            All Coursework & Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Access course assignment folders on OneDrive and record individual or team completion confirmations.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold border border-slate-200/70 shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md transition-colors btn-press ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All <span className="tabular-nums font-mono text-[11px] ml-0.5">({assignments.length})</span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-md transition-colors btn-press ${
              filter === 'pending'
                ? 'bg-white text-amber-700 shadow-xs border border-amber-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending <span className="tabular-nums font-mono text-[11px] ml-0.5">({assignments.filter((a) => !a.has_submitted).length})</span>
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1 rounded-md transition-colors btn-press ${
              filter === 'submitted'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submitted <span className="tabular-nums font-mono text-[11px] ml-0.5">({assignments.filter((a) => a.has_submitted).length})</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
          <div className="h-56 bg-slate-200 rounded-xl" />
          <div className="h-56 bg-slate-200 rounded-xl" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            filter === 'all'
              ? 'No assignments available'
              : filter === 'pending'
              ? 'All caught up'
              : 'No confirmed submissions yet'
          }
          description={
            filter === 'all'
              ? 'No coursework is currently targeted to you or your group.'
              : filter === 'pending'
              ? 'You have submitted confirmations for all assigned coursework.'
              : 'Once you confirm your external OneDrive uploads, they will appear here.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAssignments.map((assignment) => {
            const hasSubmitted = assignment.has_submitted;
            const dueDate = new Date(assignment.due_date);
            const isPastDue = dueDate < new Date();
            const isGroup = assignment.submission_type === 'GROUP';
            const isLeader = assignment.group_progress?.is_leader;
            const leaderName = assignment.group_progress?.leader_name || 'Group Leader';

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 card-hover"
              >
                <div>
                  {/* Badges: Course, Submission Type, Status */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    {assignment.course_title && (
                      <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {assignment.course_title}
                      </span>
                    )}

                    {isGroup ? (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <Users className="w-3 h-3 mr-1" />
                        Group
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-medium uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Individual
                      </span>
                    )}

                    {hasSubmitted ? (
                      <Badge variant="confirmed" size="sm">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant="pending" size="sm">
                        <Clock className="w-3 h-3 mr-1 text-amber-600" />
                        {isPastDue ? 'Past Due' : 'Pending'}
                      </Badge>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                    {assignment.description}
                  </p>

                  {/* Due Date & Targeting */}
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 mb-3 pb-3 border-b border-slate-100">
                    <span className="flex items-center tabular-nums">
                      <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                      Due: {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span>Target: {assignment.target_summary}</span>
                  </div>

                  {/* Group Progress Section */}
                  {assignment.group_progress ? (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/70 mb-4">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700 mb-1.5">
                        <span>Team Progress ({assignment.group_progress.group_name || 'Team'})</span>
                        <span className="font-mono">{assignment.group_progress.progress_percentage}%</span>
                      </div>
                      <ProgressBar
                        progress={assignment.group_progress.progress_percentage}
                        color={assignment.group_progress.is_complete ? 'emerald' : 'indigo'}
                        size="sm"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {assignment.group_progress.confirmed_members} of {assignment.group_progress.total_members} members confirmed
                      </p>
                    </div>
                  ) : null}

                  {/* Group leader submission guidance banner */}
                  {isGroup && (
                    <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200 text-xs text-purple-900 mb-3">
                      {hasSubmitted ? (
                        <p className="flex items-center font-semibold text-emerald-800 text-[11px]">
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                          Submitted for team by {assignment.submission?.confirmed_by_leader_name || leaderName}
                        </p>
                      ) : isLeader ? (
                        <p className="text-[11px] text-purple-900">
                          <Crown className="w-3 h-3 mr-1 inline text-amber-600" />
                          <strong>You are Group Leader:</strong> Submitting will record confirmation for all group members.
                        </p>
                      ) : (
                        <p className="text-[11px] text-purple-900">
                          Only your group leader (<strong>{leaderName}</strong>) can confirm this group submission.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: OneDrive link and action button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <a
                    href={assignment.onedrive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    OneDrive Folder
                  </a>

                  {hasSubmitted ? (
                    <div className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Submitted
                    </div>
                  ) : isGroup && !isLeader ? (
                    <span className="text-[11px] text-slate-400 font-medium italic">
                      Awaiting Leader
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveModalAssignment(assignment)}
                      className={`inline-flex items-center px-3 py-1.5 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors btn-press ${
                        isGroup ? 'bg-purple-700 hover:bg-purple-800' : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {isGroup ? (
                        <>
                          <Crown className="w-3 h-3 mr-1 text-amber-300" />
                          Submit as Leader
                        </>
                      ) : (
                        'Acknowledge Submission'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2-Step Submission Modal */}
      {activeModalAssignment && (
        <SubmissionModal
          isOpen={!!activeModalAssignment}
          onClose={() => setActiveModalAssignment(null)}
          assignment={activeModalAssignment}
          onSubmissionSuccess={handleSubmissionSuccess}
        />
      )}
    </div>
  );
}
