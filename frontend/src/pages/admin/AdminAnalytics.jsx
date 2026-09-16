import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function AdminAnalytics() {
  const [completionData, setCompletionData] = useState(null);
  const [groupPerformanceData, setGroupPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [compRes, perfRes] = await Promise.all([
        api.getCompletionAnalytics(),
        api.getGroupPerformanceAnalytics()
      ]);
      setCompletionData(compRes.data);
      setGroupPerformanceData(perfRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Performance & Completion Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Submission completion tracking and group performance indicators.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Overall Completion Summary KPI Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <span>Overall Submission Completion</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expected Submissions
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {completionData?.total_expected || 0}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Across all assignments</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Confirmed Submissions
            </span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {completionData?.total_confirmed || 0}
            </p>
            <span className="text-[11px] text-emerald-500 mt-0.5 block">Self-reported externally</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Pending Submissions
            </span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">
              {completionData?.total_pending || 0}
            </p>
            <span className="text-[11px] text-amber-500 mt-0.5 block">Awaiting confirmation</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
              Completion Rate
            </span>
            <p className="text-2xl font-extrabold text-brand-700 mt-1">
              {completionData?.completion_percentage || 0}%
            </p>
            <div className="mt-2">
              <ProgressBar
                value={completionData?.completion_percentage || 0}
                showLabel={false}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Completion By Assignment Visual Bars */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Completion By Assignment</h2>
              <p className="text-xs text-slate-500">Submission rates per posted coursework</p>
            </div>
          </div>
        </div>

        {(!completionData?.by_assignment || completionData.by_assignment.length === 0) ? (
          <EmptyState
            icon={FileText}
            title="No assignment data"
            description="Create assignments to observe completion metrics."
          />
        ) : (
          <div className="space-y-6">
            {completionData.by_assignment.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-sm">{item.title}</span>
                    <Badge variant={item.target_type === 'ALL_STUDENTS' ? 'all_students' : 'group'} size="sm">
                      {item.target_type === 'ALL_STUDENTS' ? 'All Students' : 'Group Specific'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-500">
                    <span>
                      <strong className="text-emerald-600">{item.confirmed_submissions}</strong> of {item.expected_submissions} confirmed
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {item.completion_percentage}%
                    </span>
                  </div>
                </div>

                <ProgressBar
                  value={item.completion_percentage}
                  confirmed={item.confirmed_submissions}
                  total={item.expected_submissions}
                  showLabel={false}
                  size="md"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Group Performance Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Group Performance Ranking</h2>
              <p className="text-xs text-slate-500">
                Formula: (Confirmed Submissions / Expected Submissions) × 100
              </p>
            </div>
          </div>
        </div>

        {groupPerformanceData.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No groups found"
            description="When student groups are formed and assignments are published, performance figures will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 pl-4">Group Name</th>
                  <th className="py-3 px-4">Members</th>
                  <th className="py-3 px-4">Assignments Targeted</th>
                  <th className="py-3 px-4">Expected Confirmations</th>
                  <th className="py-3 px-4">Confirmed Submissions</th>
                  <th className="py-3 pr-4">Completion Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupPerformanceData.map((g) => (
                  <tr key={g.group_id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 pl-4 font-bold text-slate-900 text-sm">
                      {g.group_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {g.member_count} Students
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {g.assignments_count}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {g.expected_submissions}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600">
                      {g.confirmed_submissions}
                    </td>
                    <td className="py-3.5 pr-4 w-48">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <ProgressBar
                            value={g.completion_percentage}
                            confirmed={g.confirmed_submissions}
                            total={g.expected_submissions}
                            showLabel={false}
                            size="sm"
                          />
                        </div>
                        <span className="font-extrabold text-slate-800 text-xs w-10 text-right">
                          {g.completion_percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
