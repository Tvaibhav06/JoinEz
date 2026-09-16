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
  AlertCircle
} from 'lucide-react';

export default function AdminMonitoring() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAssignmentId = searchParams.get('assignment_id');

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(initialAssignmentId || '');
  const [activeTab, setActiveTab] = useState('group'); // 'group' | 'student'

  const [groupMonitoring, setGroupMonitoring] = useState(null);
  const [studentMonitoring, setStudentMonitoring] = useState([]);
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

  // 2. Load monitoring data when selectedAssignmentId or activeTab changes
  useEffect(() => {
    if (!selectedAssignmentId) return;

    async function loadMonitoringData() {
      setLoading(true);
      setErrorMsg('');
      try {
        if (activeTab === 'group') {
          const res = await api.getAdminGroupMonitoring(selectedAssignmentId);
          setGroupMonitoring(res.data);
        } else {
          const res = await api.getAdminStudentMonitoring(selectedAssignmentId);
          setStudentMonitoring(res.data?.students || []);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load monitoring data');
      } finally {
        setLoading(false);
      }
    }

    loadMonitoringData();
  }, [selectedAssignmentId, activeTab]);

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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Submission Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inspection of team and individual student submission confirmations.
          </p>
        </div>

        {/* Assignment Dropdown & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Assignment Selector */}
          <div className="w-full sm:w-60">
            <select
              value={selectedAssignmentId}
              onChange={(e) => handleAssignmentChange(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white shadow-xs text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Group-wise vs Student-wise Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold border border-slate-200/70">
            <button
              onClick={() => setActiveTab('group')}
              className={`flex items-center px-3 py-1 rounded-md transition-colors btn-press ${
                activeTab === 'group'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Group-Wise
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center px-3 py-1 rounded-md transition-colors btn-press ${
                activeTab === 'student'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              Student-Wise
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

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-36 bg-slate-200 rounded-xl w-full" />
          <div className="h-36 bg-slate-200 rounded-xl w-full" />
        </div>
      ) : activeTab === 'group' ? (
        /* GROUP-WISE MONITORING VIEW */
        <div>
          {(!groupMonitoring?.groups || groupMonitoring.groups.length === 0) ? (
            <EmptyState
              icon={Users}
              title="No groups targeted"
              description="This assignment has no active teams associated with it."
            />
          ) : (
            <div className="space-y-4">
              {groupMonitoring.groups.map((group) => (
                <div
                  key={group.group_id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900">{group.group_name}</h3>
                        {group.is_complete ? (
                          <Badge variant="complete" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Complete (100%)
                          </Badge>
                        ) : (
                          <Badge variant="pending" size="sm">
                            {group.progress_percentage}% Done
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                        {group.total_members} total members • {group.confirmed_members} confirmed • {group.pending_members} pending
                      </p>
                    </div>

                    <div className="w-full sm:w-56">
                      <ProgressBar
                        value={group.progress_percentage}
                        confirmed={group.confirmed_members}
                        total={group.total_members}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Members Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="pb-2 pl-2">Student Name</th>
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 pr-2">Confirmation Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.members.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 pl-2 font-medium text-slate-800">
                              {member.name}
                            </td>
                            <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                              {member.email}
                            </td>
                            <td className="py-2.5">
                              {member.status === 'confirmed' ? (
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                  Confirmed
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                  <Clock className="w-3 h-3 mr-1 text-amber-600" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-2 text-slate-500 tabular-nums">
                              {member.confirmed_at
                                ? new Date(member.confirmed_at).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* STUDENT-WISE MONITORING VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          {/* Search Box */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search student, email, or team..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {filteredStudents.length === 0 ? (
            <EmptyState
              icon={User}
              title="No students found"
              description="No targeted student matches your current filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 pl-4">Student</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 pr-4">Confirmation Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.student_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pl-4">
                        <span className="font-semibold text-slate-800">{s.student_name}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {s.student_email}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {s.group_name}
                      </td>
                      <td className="py-2.5 px-3">
                        {s.status === 'confirmed' ? (
                          <Badge variant="confirmed" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge variant="pending" size="sm">
                            <Clock className="w-3 h-3 mr-1 text-amber-600" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500 tabular-nums">
                        {s.confirmed_at
                          ? new Date(s.confirmed_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

