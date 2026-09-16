import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import {
  Eye,
  Users,
  User,
  CheckCircle2,
  Clock,
  Search,
  Calendar,
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Submission Monitoring
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time professor tracking of student assignment confirmations.
          </p>
        </div>

        {/* Assignment Dropdown & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Assignment Selector */}
          <div className="w-full sm:w-64">
            <select
              value={selectedAssignmentId}
              onChange={(e) => handleAssignmentChange(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-white shadow-xs text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Group-wise vs Student-wise Tabs */}
          <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('group')}
              className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'group'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Group-Wise
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'student'
                  ? 'bg-white text-brand-700 shadow-xs'
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-2xl w-full" />
          <div className="h-44 bg-slate-200 rounded-2xl w-full" />
        </div>
      ) : activeTab === 'group' ? (
        /* GROUP-WISE MONITORING VIEW */
        <div>
          {(!groupMonitoring?.groups || groupMonitoring.groups.length === 0) ? (
            <EmptyState
              icon={Users}
              title="No groups targeted"
              description="This assignment has no active groups associated with it."
            />
          ) : (
            <div className="space-y-6">
              {groupMonitoring.groups.map((group) => (
                <div
                  key={group.group_id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-base font-bold text-slate-900">{group.group_name}</h3>
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
                      <p className="text-xs text-slate-500 mt-0.5">
                        {group.total_members} total members • {group.confirmed_members} confirmed • {group.pending_members} pending
                      </p>
                    </div>

                    <div className="w-full sm:w-64">
                      <ProgressBar
                        value={group.progress_percentage}
                        confirmed={group.confirmed_members}
                        total={group.total_members}
                        showLabel={false}
                        size="md"
                      />
                    </div>
                  </div>

                  {/* Members Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="pb-2.5 pl-2">Student Name</th>
                          <th className="pb-2.5">Email</th>
                          <th className="pb-2.5">Status</th>
                          <th className="pb-2.5 pr-2">Confirmation Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.members.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 pl-2 font-medium text-slate-800">
                              {member.name}
                            </td>
                            <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                              {member.email}
                            </td>
                            <td className="py-2.5">
                              {member.status === 'confirmed' ? (
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                  Confirmed
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <Clock className="w-3 h-3 mr-1 text-amber-600" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-2 text-slate-500">
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          {/* Search Box */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search by student name, email, group..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 pl-4">Student</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 pr-4">Confirmation Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.student_id} className="hover:bg-slate-50/50">
                      <td className="py-3 pl-4">
                        <span className="font-semibold text-slate-800">{s.student_name}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {s.student_email}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {s.group_name}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 pr-4 text-slate-500">
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
