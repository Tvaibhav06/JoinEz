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
  Filter,
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

  const handleSubmissionSuccess = (confirmedSubmission) => {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Assignments & Submissions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Access course assignment folders on OneDrive and confirm your completion status.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-white text-brand-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({assignments.filter((a) => !a.has_submitted).length})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'submitted'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submitted ({assignments.filter((a) => a.has_submitted).length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            filter === 'all'
              ? 'No assignments available'
              : filter === 'pending'
              ? 'All caught up!'
              : 'No completed assignments yet'
          }
          description={
            filter === 'all'
              ? 'No assignments are currently targeted to you or your group.'
              : filter === 'pending'
              ? 'You have submitted confirmations for all your assigned coursework.'
              : 'Once you confirm your external OneDrive submissions, they will appear here.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => {
            const hasSubmitted = assignment.has_submitted;
            const dueDate = new Date(assignment.due_date);
            const isPastDue = dueDate < new Date();

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Card Header: Target and Submission Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge
                      variant={assignment.target_summary === 'All Students' ? 'all_students' : 'group'}
                      size="sm"
                    >
                      {assignment.target_summary}
                    </Badge>
                    {hasSubmitted ? (
                      <Badge variant="confirmed" size="sm">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant={isPastDue ? 'pending' : 'pending'} size="sm">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {isPastDue ? 'Due Soon / Past' : 'Pending Submission'}
                      </Badge>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 mb-1.5 leading-snug">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {assignment.description}
                  </p>

                  {/* Due Date & Creator */}
                  <div className="flex items-center space-x-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Due: {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span>Posted by {assignment.creator_name}</span>
                  </div>

                  {/* Group Progress Section */}
                  {assignment.group_progress ? (
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 mb-5">
                      <span className="text-xs font-semibold text-slate-700 block mb-2">
                        Group Progress Tracking
                      </span>
                      <ProgressBar
                        value={assignment.group_progress.progress_percentage}
                        confirmed={assignment.group_progress.confirmed_members}
                        total={assignment.group_progress.total_members}
                        label={`${assignment.group_progress.confirmed_members} of ${assignment.group_progress.total_members} members confirmed`}
                        size="md"
                      />
                    </div>
                  ) : (
                    <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-800 mb-5">
                      Join a group to contribute to team progress on this assignment.
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  {/* External OneDrive Link (MUST HAVE target="_blank" rel="noopener noreferrer") */}
                  <a
                    href={assignment.onedrive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
                    Open OneDrive Link
                  </a>

                  {/* Confirmation Trigger Button */}
                  {hasSubmitted ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      Submission Confirmed
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveModalAssignment(assignment)}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-all"
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
