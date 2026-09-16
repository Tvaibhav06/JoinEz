import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import AdminAssignmentForm from '../../components/AdminAssignmentForm';
import {
  FileText,
  PlusCircle,
  Edit2,
  ExternalLink,
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [assignRes, analyticsRes] = await Promise.all([
        api.getAssignments(),
        api.getGroupPerformanceAnalytics()
      ]);
      setAssignments(assignRes.data || []);
      setGroups(analyticsRes.data ? analyticsRes.data.map(g => ({ id: g.group_id, name: g.group_name })) : []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Assignment Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create, edit, and target coursework with external OneDrive submission folders.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Create Assignment
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded-lg w-full" />
          <div className="h-10 bg-slate-200 rounded-lg w-full" />
          <div className="h-10 bg-slate-200 rounded-lg w-full" />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments created yet"
          description="Get started by creating an assignment with title, description, due date, and OneDrive link."
          action={
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Create First Assignment
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 pl-6">Title & Description</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Targeting</th>
                  <th className="py-3.5 px-4">OneDrive Link</th>
                  <th className="py-3.5 px-4">Confirmations</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pl-6 max-w-xs sm:max-w-sm">
                      <span className="font-bold text-slate-900 block text-sm mb-0.5">
                        {assignment.title}
                      </span>
                      <span className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                        {assignment.description}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(assignment.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Badge
                        variant={assignment.target_summary === 'All Students' ? 'all_students' : 'group'}
                        size="sm"
                      >
                        {assignment.target_summary}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <a
                        href={assignment.onedrive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-brand-600 hover:text-brand-700 hover:underline font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        OneDrive URL
                      </a>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        {assignment.confirmed_count || 0} Confirmed
                      </span>
                    </td>
                    <td className="py-4 pr-6 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(assignment)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-brand-600 font-medium transition-colors"
                        title="Edit Assignment"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </button>
                      <Link
                        to={`/admin/monitoring?assignment_id=${assignment.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100/80 text-brand-700 rounded-lg font-semibold transition-colors"
                        title="View Live Monitoring"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Monitor
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reusable Create/Edit Modal */}
      <AdminAssignmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialAssignment={editingAssignment}
        availableGroups={groups}
        onSuccess={loadData}
      />
    </div>
  );
}
