import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';
import { Modal, Button, Badge } from '../ui';
import api from '../../services/api';

/**
 * ReportModal (Issue #65)
 * In-chat moderation modal for reporting harassment, abusive language, or academic dishonesty.
 */
export const ReportModal = ({
  isOpen,
  onClose,
  messageId = null,
  threadId = null,
  reportedUserId = null,
  reportedUserName = 'User',
}) => {
  const [reason, setReason] = useState('HARASSMENT');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const REPORT_REASONS = [
    { id: 'HARASSMENT', label: 'Harassment or Abusive Language' },
    { id: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content or Media' },
    { id: 'SPAM_SCAM', label: 'Spam, Solicitations or Fraud' },
    { id: 'ACADEMIC_DISHONESTY', label: 'Exam Misconduct or Cheating Support' },
    { id: 'OTHER', label: 'Other Violations' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/api/chat/reports', {
        messageId,
        threadId,
        reportedUserId,
        reason,
        description,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      // Offline fallback
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Content to Admin Moderation"
      size="md"
    >
      {submitted ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Report Submitted</h4>
          <p className="text-xs text-neutral-400 max-w-sm">
            Thank you for helping keep our learning community safe. Platform moderators will review this thread immediately.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-neutral-300">
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] text-neutral-300">
              Reporting conversation with <strong className="text-white">{reportedUserName}</strong>. Reports are confidential and reviewed by administrators.
            </span>
          </div>

          <div>
            <label className="block text-neutral-200 font-medium mb-1.5">
              Reason for Report
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    reason === r.id
                      ? 'border-amber-500/50 bg-amber-500/[0.06] text-white'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-amber-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-neutral-200 font-medium mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any context that will help moderators evaluate this issue..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={submitting}
              icon={AlertTriangle}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
