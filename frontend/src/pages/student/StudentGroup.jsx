import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from '../../components/ProgressBar';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import {
  Users,
  UserPlus,
  Crown,
  Calendar,
  Mail,
  Hash,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  FileCheck
} from 'lucide-react';

export default function StudentGroup() {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Create Group state
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Add Member Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [emailOrId, setEmailOrId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addErrorMsg, setAddErrorMsg] = useState('');
  const [addSuccessMsg, setAddSuccessMsg] = useState('');

  const loadGroupData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const groupRes = await api.getMyGroup();
      if (groupRes.data) {
        setGroup(groupRes.data);
        // Load group progress across assignments
        const progRes = await api.getGroupProgress(groupRes.data.id);
        setProgressList(progRes.data || []);
      } else {
        setGroup(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    setErrorMsg('');
    try {
      await api.createGroup({ name: newGroupName });
      setNewGroupName('');
      await loadGroupData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!emailOrId.trim()) return;
    setAddingMember(true);
    setAddErrorMsg('');
    setAddSuccessMsg('');

    try {
      const res = await api.addGroupMember(group.id, { emailOrId });
      setAddSuccessMsg(res.message || 'Member added successfully');
      setEmailOrId('');
      // Reload group data to show updated member list and dynamic progress
      await loadGroupData();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccessMsg('');
      }, 1200);
    } catch (err) {
      setAddErrorMsg(err.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-2xl w-full" />
        <div className="h-64 bg-slate-200 rounded-2xl w-full" />
      </div>
    );
  }

  // If student has no group, show Group Creation view
  if (!group) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Form Your Assignment Team
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            You are not part of a group yet. Each student may belong to one active group at a time. Create your group below and invite members.
          </p>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateGroup} className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 text-left mb-1">
                Group Name
              </label>
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Team Alpha, Code Crafters..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={creatingGroup}
              className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {creatingGroup ? 'Creating...' : 'Create Group & Become Creator'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Group Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Group
            </span>
            <Badge variant="student" size="sm">
              {group.members.length} Members
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {group.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
            <span>Created by <strong>{group.creator_name}</strong></span>
            <span>•</span>
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {new Date(group.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </p>
        </div>

        {/* Action: Add Member */}
        <button
          type="button"
          onClick={() => {
            setAddErrorMsg('');
            setAddSuccessMsg('');
            setEmailOrId('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Add Member
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Group Members List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Team Roster</h2>
              <p className="text-xs text-slate-500">All registered students in this group</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Student</th>
                <th className="pb-3">Student ID</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Role</th>
                <th className="pb-3 pr-2">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {group.members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">{member.name}</span>
                        {member.id === user?.id && (
                          <span className="ml-1.5 text-[10px] text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600 font-mono">
                    #{member.id}
                  </td>
                  <td className="py-3.5 text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    {member.is_creator ? (
                      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Crown className="w-3 h-3 mr-1 text-amber-600" />
                        Creator
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        Member
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-2 text-slate-500">
                    {new Date(member.joined_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group Progress Across Assignments Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Assignment Progress Breakdown</h2>
              <p className="text-xs text-slate-500">Live submission progress calculated from member confirmations</p>
            </div>
          </div>
        </div>

        {progressList.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="No assignments to track"
            description="There are currently no assignments targeted to this group."
          />
        ) : (
          <div className="space-y-4">
            {progressList.map((item) => (
              <div
                key={item.assignment.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{item.assignment.title}</h4>
                    <p className="text-xs text-slate-500">
                      Due: {new Date(item.assignment.due_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    {item.is_complete ? (
                      <Badge variant="complete" size="sm">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Group Complete (100%)
                      </Badge>
                    ) : (
                      <Badge variant="pending" size="sm">
                        {item.confirmed_members} of {item.total_members} Confirmed ({item.progress_percentage}%)
                      </Badge>
                    )}
                  </div>
                </div>

                <ProgressBar
                  value={item.progress_percentage}
                  confirmed={item.confirmed_members}
                  total={item.total_members}
                  label="Team Confirmations"
                  size="md"
                />

                {/* Member checklist */}
                <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {item.member_statuses.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                    >
                      <span className="font-medium text-slate-700 truncate">{m.name}</span>
                      {m.status === 'confirmed' ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Done
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-600">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Member to Group"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter a registered student's email address or numeric Student ID. Per system rules, students can belong to only one group at a time.
          </p>

          {addErrorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{addErrorMsg}</span>
            </div>
          )}

          {addSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{addSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Email or Student ID
            </label>
            <input
              type="text"
              required
              value={emailOrId}
              onChange={(e) => setEmailOrId(e.target.value)}
              placeholder="e.g. student3@demo.com or 3"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingMember}
              className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {addingMember ? 'Adding...' : 'Add Student to Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
