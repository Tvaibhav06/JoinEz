import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import {
  BarChart3,
  FileText,
  TrendingUp,
  AlertCircle,
  Users
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
          <div className="h-24 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
          <div className="h-24 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-56 bg-slate-200 rounded-xl" />
        <div className="h-56 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Performance & Completion Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive submission completion tracking and comparative group performance indicators.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Overall Completion Summary KPI Cards */}
      <div>
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
          <span>Overall Submission Completion</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Expected Submissions
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums font-mono">
              {completionData?.total_expected || 0}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Across all assignments</span>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Confirmed Submissions
            </span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums font-mono">
              {completionData?.total_confirmed || 0}
            </p>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">Verified by students</span>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              Pending Submissions
            </span>
            <p className="text-2xl font-extrabold text-amber-700 mt-1 tabular-nums font-mono">
              {completionData?.total_pending || 0}
            </p>
            <span className="text-[10px] text-amber-600 mt-0.5 block">Awaiting confirmation</span>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
              Completion Rate
            </span>
            <p className="text-2xl font-extrabold text-indigo-900 mt-1 tabular-nums font-mono">
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
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Completion By Assignment</h2>
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
          <div className="space-y-4">
            {completionData.by_assignment.map((item) => (
              <div key={item.id} className="space-y-1.5 p-3 rounded-lg bg-slate-50/50 border border-slate-200/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                    <Badge variant={item.target_type === 'ALL_STUDENTS' ? 'all_students' : 'group'} size="sm">
                      {item.target_type === 'ALL_STUDENTS' ? 'All Students' : 'Group Specific'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-500 text-[11px] tabular-nums">
                    <span>
                      <strong className="text-emerald-700">{item.confirmed_submissions}</strong> of {item.expected_submissions} confirmed
                    </span>
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {item.completion_percentage}%
                    </span>
                  </div>
                </div>

                <ProgressBar
                  value={item.completion_percentage}
                  confirmed={item.confirmed_submissions}
                  total={item.expected_submissions}
                  showLabel={false}
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Group Performance Analytics */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Group Performance Ranking</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Formula: (Confirmed Submissions ÷ Expected Submissions) × 100
              </p>
            </div>
          </div>
        </div>

        {groupPerformanceData.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No groups found"
            description="When student teams are formed and assignments are published, performance figures will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 pl-4">Team Name</th>
                  <th className="py-2.5 px-3">Members</th>
                  <th className="py-2.5 px-3">Assignments</th>
                  <th className="py-2.5 px-3">Expected</th>
                  <th className="py-2.5 px-3">Confirmed</th>
                  <th className="py-2.5 pr-4">Completion Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupPerformanceData.map((g) => (
                  <tr key={g.group_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pl-4 font-bold text-slate-900 text-xs">
                      {g.group_name}
                    </td>
                    <td className="py-3 px-3 text-slate-600 tabular-nums">
                      {g.member_count}
                    </td>
                    <td className="py-3 px-3 text-slate-600 tabular-nums">
                      {g.assignments_count}
                    </td>
                    <td className="py-3 px-3 text-slate-600 tabular-nums font-mono">
                      {g.expected_submissions}
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-700 tabular-nums font-mono">
                      {g.confirmed_submissions}
                    </td>
                    <td className="py-3 pr-4 w-44">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex-1">
                          <ProgressBar
                            value={g.completion_percentage}
                            confirmed={g.confirmed_submissions}
                            total={g.expected_submissions}
                            showLabel={false}
                            size="sm"
                          />
                        </div>
                        <span className="font-bold text-slate-900 text-xs font-mono w-9 text-right tabular-nums">
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

