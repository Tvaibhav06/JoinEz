import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { ExternalLink, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

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
      title={step === 1 ? 'Step 1: Upload Confirmation' : 'Step 2: Final Verification'}
    >
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
            <h4 className="text-xs font-bold text-slate-900 mb-1">{assignment.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-2 mb-2.5">{assignment.description}</p>
            <div>
              <a
                href={assignment.onedrive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Open Assignment OneDrive Folder
              </a>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 space-y-1">
            <p className="font-semibold text-amber-950">External Submission Requirement:</p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Files must be placed directly into the OneDrive folder above. This prompt only records that you have completed your external upload.
            </p>
          </div>

          <p className="text-xs text-slate-700 font-medium pt-1">
            Have you finished uploading your coursework to the external OneDrive folder?
          </p>

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleStep1}
              className="inline-flex items-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors btn-press disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Yes, I have submitted externally'}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Step 1 Acknowledged</p>
              <p className="text-[11px] text-emerald-700">
                You indicated that your file has been placed in OneDrive.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 space-y-1.5">
            <p className="font-semibold text-slate-800">Final Confirmation</p>
            <p className="text-slate-600 text-xs">
              Confirm that you are ready to record your official submission for <strong>{assignment.title}</strong>.
            </p>
            <p className="text-slate-500 text-[11px]">
              Once recorded, this cannot be undone and your group's live completion rate will update immediately.
            </p>
          </div>

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors btn-press"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleStep2Confirm}
              className="inline-flex items-center px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors btn-press disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

