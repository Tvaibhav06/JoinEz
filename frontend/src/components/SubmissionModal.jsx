import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { ExternalLink, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function SubmissionModal({ isOpen, onClose, assignment, onSubmissionSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => {
    setStep(1);
    setErrorMsg('');
    setLoading(false);
    onClose();
  };

  const handleStep1 = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await api.step1Submission(assignment.id);
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to record Step 1');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Confirm = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.confirmSubmission(assignment.id);
      onSubmissionSuccess(res.data);
      handleClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to confirm submission');
      setLoading(false);
    }
  };

  if (!assignment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 1 ? 'Submission Confirmation — Step 1 of 2' : 'Confirm Submission — Step 2 of 2'}
    >
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">{assignment.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{assignment.description}</p>
            <div className="flex items-center space-x-2">
              <a
                href={assignment.onedrive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Open External OneDrive Folder
              </a>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <p className="font-semibold">External Submission Notice:</p>
            <p className="text-amber-800">
              Files must be uploaded directly to the OneDrive folder above. This internal action only records that you have completed your external upload.
            </p>
          </div>

          <p className="text-sm text-slate-700 font-medium pt-1">
            Have you finished uploading your work to the OneDrive submission link?
          </p>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleStep1}
              className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Yes, I have submitted externally'}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Step 1 Acknowledged</p>
              <p className="text-xs text-emerald-700">
                You indicated that you uploaded your assignment externally.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">Final Verification:</p>
            <p>
              Are you sure you want to record your final submission confirmation for <strong>{assignment.title}</strong>?
            </p>
            <p className="text-slate-500 text-[11px]">
              Once confirmed, this cannot be undone, and your group's progress will be updated immediately.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleStep2Confirm}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
