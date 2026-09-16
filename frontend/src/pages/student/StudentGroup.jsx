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
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  FileCheck,
  Clock
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
        <div className="h-32 bg-slate-200 rounded-xl w-full" />
        <div className="h-56 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  // If student has no group, show Group Creation view
  if (!group) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-7 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3.5">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1.5">
            Form Your Course Team
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            You are not part of a team yet. Each student belongs to one active group. Create your group below to start adding teammates.
          </p>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateGroup} className="max-w-sm mx-auto space-y-3.5">
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={creatingGroup}
              className="w-full inline-flex items-center justify-center py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors btn-press disabled:opacity-50"
            >
              {creatingGroup ? 'Creating Team...' : 'Create Team & Become Creator'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Active Team
            </span>
            <Badge variant="student" size="sm">
              {group.members.length} Members
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {group.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2.5">
            <span>Lead: <strong>{group.creator_name}</strong></span>
            <span>•</span>
            <span className="flex items-center tabular-nums">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              Created {new Date(group.created_at).toLocaleDateString(undefined, {
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
          className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors btn-press"
        >
          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
          Add Teammate
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Group Members List */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Team Roster</h2>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-2.5 pl-2">Student</th>
                <th className="pb-2.5">Student ID</th>
                <th className="pb-2.5">Email</th>
                <th className="pb-2.5">Role</th>
                <th className="pb-2.5 pr-2">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {group.members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {member.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800">{member.name}</span>
                      {member.id === user?.id && (
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-slate-500 font-mono text-[11px] tabular-nums">
                    #{member.id}
                  </td>
                  <td className="py-3 text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">{member.email}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    {member.is_creator ? (
                      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70">
                        <Crown className="w-3 h-3 mr-1 text-amber-600" />
                        Creator
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Member
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-2 text-slate-500 tabular-nums">
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
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Assignment Progress Breakdown</h2>
            </div>
          </div>
        </div>

        {progressList.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="No coursework assigned"
            description="There are currently no assignments targeted to this team."
          />
        ) : (
          <div className="space-y-4">
            {progressList.map((item) => (
              <div
                key={item.assignment.id}
                className="p-4 rounded-lg border border-slate-200/80 bg-slate-50/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.assignment.title}</h4>
                    <p className="text-[11px] text-slate-500 tabular-nums">
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
                        Team Complete (100%)
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
                  size="sm"
                />

                {/* Member checklist */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {item.member_statuses.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs"
                    >
                      <span className="font-medium text-slate-700 truncate">{m.name}</span>
                      {m.status === 'confirmed' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 flex items-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Done
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 flex items-center shrink-0">
                          <Clock className="w-3 h-3 mr-1 text-amber-600" />
                          Pending
                        </span>
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
        title="Add Teammate to Group"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter a registered student's email address or numeric Student ID. Per course rules, each student may belong to only one active team at a time.
          </p>

          {addErrorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{addErrorMsg}</span>
            </div>
          )}

          {addSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingMember}
              className="inline-flex items-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors btn-press disabled:opacity-50"
            >
              {addingMember ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

