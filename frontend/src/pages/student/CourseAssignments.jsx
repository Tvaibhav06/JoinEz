import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import SubmissionModal from '../../components/SubmissionModal';
import {
  BookOpen,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  Check,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Crown,
  Users,
  UserCheck,
  Info
} from 'lucide-react';

export default function CourseAssignments() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'submitted'
  const [activeModalAssignment, setActiveModalAssignment] = useState(null);

  const fetchCourseData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getCourseAssignments(courseId);
      setCourse(res.data?.course || null);
      setAssignments(res.data?.assignments || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load course assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const handleSubmissionSuccess = () => {
    fetchCourseData();
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'pending') return !a.has_submitted;
    if (filter === 'submitted') return a.has_submitted;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-xl w-full" />
        <div className="h-48 bg-slate-200 rounded-xl w-full" />
        <div className="h-48 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  if (errorMsg && !course) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{errorMsg}</p>
        <Link
          to="/student"
          className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Enrolled Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link to="/student" className="hover:text-slate-900 transition-colors flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Enrolled Courses
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate">{course?.title}</span>
      </div>

      {/* Course Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/70">
              Course Assignments
            </span>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Instructor: {course?.professor_name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {course?.title}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 max-w-xl">
            {course?.description}
          </p>
        </div>

        {/* Filter Controls */}
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

      {/* Assignment List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <EmptyState
            title="No Assignments Found"
            description={
              filter === 'all'
                ? 'There are currently no active assignments posted for this course.'
                : `No assignments matching filter "${filter}".`
            }
            icon={FileText}
          />
        ) : (
          filteredAssignments.map((a) => {
            const isGroup = a.submission_type === 'GROUP';
            const isLeader = a.group_progress?.is_leader;
            const leaderName = a.group_progress?.leader_name || 'Group Leader';
            const hasSubmitted = a.has_submitted;

            const isDueDatePassed = new Date(a.due_date) < new Date();
            const formattedDueDate = new Date(a.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs transition-all hover:border-slate-300 flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Assignment Main Content */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Submission Type Badge */}
                    {isGroup ? (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <Users className="w-3 h-3 mr-1 text-purple-600" />
                        Group Assignment
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <UserCheck className="w-3 h-3 mr-1 text-blue-600" />
                        Individual Assignment
                      </span>
                    )}

                    {/* Status Badge */}
                    {hasSubmitted ? (
                      <Badge variant="success" dot size="sm">
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant="warning" dot size="sm">
                        Pending
                      </Badge>
                    )}

                    {/* Due Date Badge */}
                    <span
                      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded ${
                        isDueDatePassed
                          ? 'text-rose-700 bg-rose-50 border border-rose-200'
                          : 'text-slate-600 bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                      Due: {formattedDueDate}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {a.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                      {a.description}
                    </p>
                  </div>

                  {/* Submission Specific Guidance */}
                  {isGroup ? (
                    <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200/80 text-xs text-purple-950 space-y-1">
                      <div className="flex items-center space-x-1.5 font-semibold">
                        <Crown className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>Team Submission Protocol ({a.group_progress?.group_name || 'Team'})</span>
                      </div>
                      <p className="text-[11px] text-purple-900 leading-relaxed">
                        {hasSubmitted ? (
                          <span className="text-emerald-800 font-semibold flex items-center">
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Confirmed by Group Leader ({a.submission?.confirmed_by_leader_name || leaderName}) on behalf of your entire team.
                          </span>
                        ) : isLeader ? (
                          <span>
                            You are the <strong>Group Leader</strong>. Once your team finishes uploading to OneDrive, use the button below to confirm submission on behalf of all team members.
                          </span>
                        ) : (
                          <span>
                            Only your designated group leader (<strong>{leaderName}</strong>) can record the final submission confirmation on behalf of the group.
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    hasSubmitted && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>You have completed and recorded your individual submission.</span>
                      </div>
                    )
                  )}

                  {/* Links and Actions */}
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <a
                      href={a.onedrive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Open OneDrive Assignment Folder
                    </a>
                  </div>
                </div>

                {/* Status & Confirmation Panel */}
                <div className="w-full md:w-64 shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {/* Dynamic Progress Bar if student belongs to group */}
                  {a.group_progress && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span>Team Progress</span>
                        <span className="font-mono tabular-nums">{a.group_progress.progress_percentage}%</span>
                      </div>
                      <ProgressBar
                        progress={a.group_progress.progress_percentage}
                        size="md"
                        color={a.group_progress.is_complete ? 'emerald' : 'indigo'}
                      />
                      <p className="text-[10px] text-slate-400">
                        {a.group_progress.confirmed_members} of {a.group_progress.total_members} members confirmed
                      </p>
                    </div>
                  )}

                  {/* Submission Action Button */}
                  <div className="pt-2">
                    {hasSubmitted ? (
                      <div className="w-full py-2.5 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center">
                        <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Status: Submitted
                      </div>
                    ) : isGroup && !isLeader ? (
                      <div className="w-full py-2.5 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium text-center space-y-0.5">
                        <div className="font-semibold text-slate-700 flex items-center justify-center">
                          <Crown className="w-3 h-3 mr-1 text-slate-400" />
                          Leader Only
                        </div>
                        <p className="text-[10px] text-slate-400">Awaiting {leaderName} to confirm</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveModalAssignment(a)}
                        className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors btn-press flex items-center justify-center ${
                          isGroup
                            ? 'bg-purple-700 hover:bg-purple-800'
                            : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {isGroup ? (
                          <>
                            <Crown className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                            Submit as Group Leader
                          </>
                        ) : (
                          'Acknowledge Submission'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submission Modal for Step 1 -> Step 2 */}
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
