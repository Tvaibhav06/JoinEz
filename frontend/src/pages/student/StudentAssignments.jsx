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
  AlertCircle
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
    // Refresh assignments list to update group progress and personal submission status
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
            Assignments & Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Access course assignment folders on OneDrive and record your external completion confirmations.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold border border-slate-200/70">
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

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 card-hover"
              >
                <div>
                  {/* Card Header: Target and Submission Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <Badge
                      variant={assignment.target_summary === 'All Students' ? 'all_students' : 'group'}
                      size="sm"
                    >
                      {assignment.target_summary}
                    </Badge>
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

                  {/* Due Date & Creator */}
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 mb-3 pb-3 border-b border-slate-100">
                    <span className="flex items-center tabular-nums">
                      <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                      Due: {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span>Posted by {assignment.creator_name}</span>
                  </div>

                  {/* Group Progress Section */}
                  {assignment.group_progress ? (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/70 mb-4">
                      <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Team Submission Progress
                      </span>
                      <ProgressBar
                        value={assignment.group_progress.progress_percentage}
                        confirmed={assignment.group_progress.confirmed_members}
                        total={assignment.group_progress.total_members}
                        label={`${assignment.group_progress.confirmed_members} of ${assignment.group_progress.total_members} members confirmed`}
                        size="sm"
                      />
                    </div>
                  ) : (
                    <div className="bg-amber-50/60 border border-amber-200/70 rounded-lg p-2.5 text-[11px] text-amber-800 mb-4">
                      Join a team to record group progress on this assignment.
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  {/* External OneDrive Link (MUST HAVE target="_blank" rel="noopener noreferrer") */}
                  <a
                    href={assignment.onedrive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors btn-press"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                    OneDrive Folder
                  </a>

                  {/* Confirmation Trigger Button */}
                  {hasSubmitted ? (
                    <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/80 cursor-default">
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Confirmed
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveModalAssignment(assignment)}
                      className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors btn-press"
                    >
                      Yes, I have submitted
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two-Step Confirmation Modal */}
      <SubmissionModal
        isOpen={!!activeModalAssignment}
        assignment={activeModalAssignment}
        onClose={() => setActiveModalAssignment(null)}
        onSubmissionSuccess={handleSubmissionSuccess}
      />
    </div>
  );
}

