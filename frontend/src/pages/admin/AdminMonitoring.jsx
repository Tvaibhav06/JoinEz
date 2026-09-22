import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import {
  Users,
  User,
  CheckCircle2,
  Clock,
  Search,
  AlertCircle,
  Crown,
  BookOpen,
  Filter,
  Check,
  UserCheck
} from 'lucide-react';

export default function AdminMonitoring() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAssignmentId = searchParams.get('assignment_id');

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(initialAssignmentId || '');
  const [activeTab, setActiveTab] = useState('group'); // 'group' | 'student'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'submitted' | 'pending'

  const [groupMonitoring, setGroupMonitoring] = useState(null);
  const [studentMonitoring, setStudentMonitoring] = useState([]);
  const [assignmentMeta, setAssignmentMeta] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Load assignments list for selector
  useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await api.getAssignments();
        const list = res.data || [];
        setAssignments(list);
        if (list.length > 0 && !selectedAssignmentId) {
          setSelectedAssignmentId(list[0].id.toString());
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load assignments');
      }
    }
    loadAssignments();
  }, []);

  // 2. Load monitoring data when selectedAssignmentId, activeTab, or statusFilter changes
  useEffect(() => {
    if (!selectedAssignmentId) return;

    async function loadMonitoringData() {
      setLoading(true);
      setErrorMsg('');
      try {
        if (activeTab === 'group') {
          const res = await api.getAdminGroupMonitoring(selectedAssignmentId);
          setGroupMonitoring(res.data);
          setAssignmentMeta(res.data?.assignment || null);
        } else {
          // Pass server-side status filter
          const res = await api.getAdminStudentMonitoring(selectedAssignmentId, statusFilter);
          setStudentMonitoring(res.data?.students || []);
          setAssignmentMeta(res.data?.assignment || null);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load monitoring data');
      } finally {
        setLoading(false);
      }
    }

    loadMonitoringData();
  }, [selectedAssignmentId, activeTab, statusFilter]);

  const handleAssignmentChange = (id) => {
    setSelectedAssignmentId(id);
    setSearchParams({ assignment_id: id });
  };

  const filteredStudents = studentMonitoring.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.student_name.toLowerCase().includes(q) ||
      s.student_email.toLowerCase().includes(q) ||
      s.group_name.toLowerCase().includes(q)
    );
  });

  const selectedAssignmentObj = assignments.find((a) => a.id.toString() === selectedAssignmentId);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Submission Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inspection of team and individual student submission confirmations with server-side status filtering.
          </p>
        </div>

        {/* Assignment Dropdown & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex-1 sm:w-64">
            <select
              value={selectedAssignmentId}
              onChange={(e) => handleAssignmentChange(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold py-2 px-3 rounded-lg shadow-xs focus:outline-none focus:border-slate-900"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.course_title ? `[${a.course_title}] ` : ''}{a.title} ({a.submission_type || 'INDIVIDUAL'})
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/80 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('group')}
              className={`px-3 py-1 rounded-md transition-colors btn-press flex items-center ${
                activeTab === 'group'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              Group View
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`px-3 py-1 rounded-md transition-colors btn-press flex items-center ${
                activeTab === 'student'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 mr-1" />
              Student View
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Assignment Context Banner */}
      {selectedAssignmentObj && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedAssignmentObj.course_title || 'Course Assignment'}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    selectedAssignmentObj.submission_type === 'GROUP'
                      ? 'text-purple-700 bg-purple-50 border-purple-200'
                      : 'text-blue-700 bg-blue-50 border-blue-200'
                  }`}
                >
                  {selectedAssignmentObj.submission_type === 'GROUP' ? 'Group Assignment' : 'Individual Assignment'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-1">
                {selectedAssignmentObj.title}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-500">Target Audience:</span>
            <p className="text-xs font-semibold text-slate-800">{selectedAssignmentObj.target_summary}</p>
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-xl" />
          <div className="h-44 bg-slate-200 rounded-xl" />
        </div>
      ) : activeTab === 'group' ? (
        /* ---------------- GROUP VIEW ---------------- */
        <div className="space-y-4">
          {groupMonitoring?.groups?.length === 0 ? (
            <EmptyState
              title="No Applicable Groups"
              description="This assignment is not targeted to any student groups."
              icon={Users}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupMonitoring?.groups?.map((g) => (
                <div
                  key={g.group_id}
                  className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-900">{g.group_name}</h3>
                        {g.leader_name && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center">
                            <Crown className="w-2.5 h-2.5 mr-1" />
                            Leader: {g.leader_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {g.confirmed_members} of {g.total_members} members confirmed
                      </p>
                    </div>

                    <Badge variant={g.is_complete ? 'success' : g.confirmed_members > 0 ? 'warning' : 'neutral'} dot>
                      {g.is_complete ? 'Complete' : g.confirmed_members > 0 ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Live Completion</span>
                      <span className="font-mono tabular-nums">{g.progress_percentage}%</span>
                    </div>
                    <ProgressBar
                      progress={g.progress_percentage}
                      color={g.is_complete ? 'emerald' : 'indigo'}
                    />
                  </div>

                  {/* Member Roster with confirmation status */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Roster & Confirmations
                    </p>
                    <div className="space-y-1.5">
                      {g.members?.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="font-medium text-slate-800 truncate">{m.name}</span>
                            {m.is_leader && (
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-100/70 px-1 rounded">
                                Leader
                              </span>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center space-x-1.5">
                            {m.status === 'confirmed' ? (
                              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                <Check className="w-3 h-3 mr-1 text-emerald-600" />
                                {m.confirmed_by_leader_id ? 'By Leader' : 'Confirmed'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ---------------- STUDENT VIEW WITH SERVER-SIDE STATUS FILTERING ---------------- */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
            {/* Server-Side Status Filter Segmented Buttons */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold border border-slate-200/70">
              <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center">
                <Filter className="w-3 h-3 mr-1" />
                Status:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors btn-press ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('submitted')}
                className={`px-3 py-1 rounded-md transition-colors btn-press ${
                  statusFilter === 'submitted'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Submitted
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-md transition-colors btn-press ${
                  statusFilter === 'pending'
                    ? 'bg-white text-amber-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
            </div>

            {/* Instant Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student or team..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Student Submissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Confirmed At</th>
                  <th className="py-3 px-4">Confirmed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No student records found matching status "{statusFilter}".
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const isSubmitted = s.status === 'confirmed';
                    const isGroup = assignmentMeta?.submission_type === 'GROUP';

                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{s.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{s.student_email}</div>
                        </td>

                        <td className="py-3 px-4 text-slate-700">
                          <span className="font-medium">{s.group_name}</span>
                          {s.is_group_leader && (
                            <span className="ml-1.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                              Leader
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
                          {assignmentMeta?.course_title || 'General'}
                        </td>

                        <td className="py-3 px-4">
                          {isGroup ? (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              Group
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              Individual
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={isSubmitted ? 'success' : 'warning'} dot size="sm">
                            {isSubmitted ? 'Submitted' : 'Pending'}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {s.confirmed_at
                            ? new Date(s.confirmed_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '—'}
                        </td>

                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {s.confirmed_by_leader_id ? (
                            <span className="inline-flex items-center text-purple-800 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                              <Crown className="w-2.5 h-2.5 mr-1 text-purple-600" />
                              Leader: {s.confirmed_by_leader_name || 'Leader'}
                            </span>
                          ) : isSubmitted ? (
                            <span className="text-slate-600">Self (Individual)</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
