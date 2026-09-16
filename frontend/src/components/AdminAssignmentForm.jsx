import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { AlertCircle } from 'lucide-react';

export default function AdminAssignmentForm({
  isOpen,
  onClose,
  initialAssignment = null,
  availableGroups = [],
  onSuccess
}) {
  const isEditing = !!initialAssignment;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [onedriveLink, setOnedriveLink] = useState('');
  const [targetType, setTargetType] = useState('ALL_STUDENTS');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialAssignment) {
      setTitle(initialAssignment.title || '');
      setDescription(initialAssignment.description || '');

      if (initialAssignment.due_date) {
        const d = new Date(initialAssignment.due_date);
        const pad = (n) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDueDate(formatted);
      } else {
        setDueDate('');
      }

      setOnedriveLink(initialAssignment.onedrive_link || '');

      const isGroupTarget = initialAssignment.targets?.some((t) => t.target_type === 'GROUP');
      if (isGroupTarget) {
        setTargetType('GROUP');
        const gids = initialAssignment.targets
          .filter((t) => t.target_type === 'GROUP' && t.group_id)
          .map((t) => t.group_id);
        setSelectedGroupIds(gids);
      } else {
        setTargetType('ALL_STUDENTS');
        setSelectedGroupIds([]);
      }
    } else {
      setTitle('');
      setDescription('');
      const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      d.setHours(23, 59, 0, 0);
      const pad = (n) => String(n).padStart(2, '0');
      const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setDueDate(formatted);
      setOnedriveLink('');
      setTargetType('ALL_STUDENTS');
      setSelectedGroupIds([]);
    }
    setErrorMsg('');
  }, [initialAssignment, isOpen]);

  const handleGroupCheckbox = (groupId) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (targetType === 'GROUP' && selectedGroupIds.length === 0) {
      setErrorMsg('Please select at least one group to target.');
      return;
    }

    setLoading(true);

    const payload = {
      title,
      description,
      dueDate: new Date(dueDate).toISOString(),
      onedriveLink,
      targetType,
      groupIds: targetType === 'GROUP' ? selectedGroupIds : []
    };

    try {
      if (isEditing) {
        await api.updateAssignment(initialAssignment.id, payload);
      } else {
        await api.createAssignment(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Assignment' : 'Create New Assignment'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Assignment Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. DBMS Query Optimization Lab"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Guidelines, instructions, and external submission requirements..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              OneDrive Submission URL
            </label>
            <input
              type="url"
              required
              value={onedriveLink}
              onChange={(e) => setOnedriveLink(e.target.value)}
              placeholder="https://onedrive.live.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
            />
          </div>
        </div>

        {/* Targeting Controls */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2.5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Assignment Targeting
          </label>

          <div className="flex items-center space-x-5">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="targetType"
                value="ALL_STUDENTS"
                checked={targetType === 'ALL_STUDENTS'}
                onChange={() => setTargetType('ALL_STUDENTS')}
                className="w-3.5 h-3.5 text-slate-900 focus:ring-slate-900"
              />
              <span>All Students</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="targetType"
                value="GROUP"
                checked={targetType === 'GROUP'}
                onChange={() => setTargetType('GROUP')}
                className="w-3.5 h-3.5 text-slate-900 focus:ring-slate-900"
              />
              <span>Specific Groups</span>
            </label>
          </div>

          {targetType === 'GROUP' && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Select target group(s):
              </span>
              {availableGroups.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No groups exist in the system yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableGroups.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center space-x-2 p-2 rounded-md bg-white border border-slate-200 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(g.id)}
                        onChange={() => handleGroupCheckbox(g.id)}
                        className="rounded text-slate-900 focus:ring-slate-900 w-3.5 h-3.5"
                      />
                      <span className="font-medium truncate">{g.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors btn-press"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors btn-press disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

