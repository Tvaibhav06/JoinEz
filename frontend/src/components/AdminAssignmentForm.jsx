import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { AlertCircle, BookOpen, Users, UserCheck } from 'lucide-react';

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
  const [courseId, setCourseId] = useState('');
  const [submissionType, setSubmissionType] = useState('INDIVIDUAL');
  const [coursesList, setCoursesList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load courses for dropdown
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await api.getCourses();
        const list = res.data || [];
        setCoursesList(list);
        if (list.length > 0 && !courseId) {
          setCourseId(list[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load courses for form', err);
      }
    }
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen]);

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
      setCourseId(initialAssignment.course_id ? initialAssignment.course_id.toString() : '');
      setSubmissionType(initialAssignment.submission_type || 'INDIVIDUAL');

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
      setSubmissionType('INDIVIDUAL');
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
      groupIds: targetType === 'GROUP' ? selectedGroupIds : [],
      courseId: courseId ? parseInt(courseId, 10) : null,
      submissionType
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
      title={isEditing ? 'Edit Assignment' : 'Create New Course Assignment'}
    >
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Course Association */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
            <BookOpen className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Associated Course
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900 bg-white"
          >
            {coursesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Submission Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Submission Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start space-x-2.5 ${
                submissionType === 'INDIVIDUAL'
                  ? 'border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="submissionType"
                value="INDIVIDUAL"
                checked={submissionType === 'INDIVIDUAL'}
                onChange={(e) => setSubmissionType(e.target.value)}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold block flex items-center">
                  <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Individual
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Each student confirms their own submission independently.
                </span>
              </div>
            </label>

            <label
              className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start space-x-2.5 ${
                submissionType === 'GROUP'
                  ? 'border-purple-500 bg-purple-50/40 text-purple-950 ring-1 ring-purple-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="submissionType"
                value="GROUP"
                checked={submissionType === 'GROUP'}
                onChange={(e) => setSubmissionType(e.target.value)}
                className="mt-0.5 text-purple-600 focus:ring-purple-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold block flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  Group (Team)
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Only designated group leader can submit on behalf of the team.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Assignment Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Database Architecture"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description & Instructions
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide task expectations and grading requirements..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900 resize-none"
          />
        </div>

        {/* Due Date & OneDrive URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Submission Deadline
            </label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              External OneDrive Folder URL
            </label>
            <input
              type="url"
              required
              value={onedriveLink}
              onChange={(e) => setOnedriveLink(e.target.value)}
              placeholder="https://onedrive.live.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Assignment Target Audience */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Audience Targeting
          </label>
          <div className="flex items-center space-x-4 mb-2.5">
            <label className="inline-flex items-center text-xs text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="targetType"
                value="ALL_STUDENTS"
                checked={targetType === 'ALL_STUDENTS'}
                onChange={(e) => setTargetType(e.target.value)}
                className="mr-1.5 text-slate-900 focus:ring-slate-900"
              />
              All Enrolled Students
            </label>
            <label className="inline-flex items-center text-xs text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="targetType"
                value="GROUP"
                checked={targetType === 'GROUP'}
                onChange={(e) => setTargetType(e.target.value)}
                className="mr-1.5 text-slate-900 focus:ring-slate-900"
              />
              Specific Team(s)
            </label>
          </div>

          {targetType === 'GROUP' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 max-h-40 overflow-y-auto">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Select Target Teams:</p>
              {availableGroups.length === 0 ? (
                <p className="text-xs text-slate-400">No groups found in system.</p>
              ) : (
                availableGroups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center space-x-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(g.id)}
                      onChange={() => handleGroupCheckbox(g.id)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span>{g.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors btn-press"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors btn-press disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Assignment' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
