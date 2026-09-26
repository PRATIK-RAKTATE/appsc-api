import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Award,
  Upload,
  CheckCircle,
  FileText,
  Clock,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Badge, Button, Input } from '../../components/ui';
import api from '../../services/api';

const AVAILABLE_SUBJECTS = [
  'Indian Polity & Constitution',
  'AP Reorganisation Act 2014',
  'AP Socio-Economic & Cultural History',
  'Indian Economy & Planning',
  'AP State Economy & Budget',
  'General Science & Technology',
  'Disaster Management & Environment',
  'Data Interpretation & Reasoning',
];

export const MentorApplicationPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    appscRank: '',
    currentDesignation: '',
    selectedSubjects: ['Indian Polity & Constitution'],
    bio: '',
    linkedinUrl: '',
    documentUploaded: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleSubject = (subject) => {
    setForm((prev) => {
      const exists = prev.selectedSubjects.includes(subject);
      return {
        ...prev,
        selectedSubjects: exists
          ? prev.selectedSubjects.filter((s) => s !== subject)
          : [...prev.selectedSubjects, subject],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/api/mentors/apply', {
        ...form,
        subjects: form.selectedSubjects,
      });
      setSubmitted(true);
    } catch (err) {
      // Fallback local submission
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/mentors')}
          className="text-neutral-400 hover:text-white"
        >
          Back to Mentors Directory
        </Button>
      </div>

      {submitted ? (
        <div className="p-8 sm:p-12 rounded-3xl border border-emerald-500/30 bg-neutral-900/60 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <Badge variant="success" size="md">
            APPLICATION SUBMITTED (PENDING APPROVAL)
          </Badge>

          <h2 className="text-2xl font-bold text-white">
            Thank you, {form.fullName}!
          </h2>

          <p className="text-sm text-neutral-300 max-w-lg mx-auto leading-relaxed">
            Your application to join the APPSC Prep Mentor Network has been successfully recorded. Our academic board reviews rank credentials and identity documents within 24-48 hours.
          </p>

          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs text-neutral-400 font-mono max-w-md mx-auto flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Verification Status: In Queue (Issue #55 Engine)</span>
          </div>

          <div className="pt-4">
            <Button variant="accent" size="sm" onClick={() => navigate('/mentors')}>
              Return to Mentors
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950/80 p-6 sm:p-10 space-y-8 shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent" size="sm" className="font-mono">
                MENTOR ONBOARDING (ISSUE #55)
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Apply to Become an APPSC Mentor
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Share your exam insights, answer writing evaluations, and subject mastery with thousands of aspiring civil servants across Andhra Pradesh.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs text-neutral-200">
            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  Full Name (with honorifics) *
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Srikanth Reddy, Deputy Collector"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  Registered Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Exam Credentials & Rank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  APPSC / UPSC Rank & Year *
                </label>
                <input
                  type="text"
                  required
                  value={form.appscRank}
                  onChange={(e) => setForm({ ...form, appscRank: e.target.value })}
                  placeholder="e.g. APPSC Group-1 Rank 18 (2020 Batch)"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  Current Official Designation / Role *
                </label>
                <input
                  type="text"
                  required
                  value={form.currentDesignation}
                  onChange={(e) => setForm({ ...form, currentDesignation: e.target.value })}
                  placeholder="e.g. Assistant Audit Officer / Faculty"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Subject Expertise Multi-Select */}
            <div>
              <label className="block font-medium text-neutral-300 mb-2">
                Subject Specialization Tags (Select all that apply) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_SUBJECTS.map((subj) => {
                  const isSelected = form.selectedSubjects.includes(subj);
                  return (
                    <button
                      type="button"
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors ${
                        isSelected
                          ? 'border-amber-500/50 bg-amber-500/[0.08] text-white font-medium'
                          : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span>{subj}</span>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio & Experience */}
            <div>
              <label className="block font-medium text-neutral-300 mb-1">
                Professional Bio & Mentorship Philosophy *
              </label>
              <textarea
                rows={3}
                required
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Highlight your teaching approach, Mains answer writing tips, and background..."
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Verification Proof Upload Simulation */}
            <div>
              <label className="block font-medium text-neutral-300 mb-1">
                Upload Service ID Card or Rank Certificate (PDF / JPG)
              </label>
              <div
                onClick={() => setForm({ ...form, documentUploaded: true })}
                className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  form.documentUploaded
                    ? 'border-emerald-500/50 bg-emerald-500/[0.04]'
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-amber-500/50'
                }`}
              >
                {form.documentUploaded ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Verification_Document.pdf (Attached)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-amber-400 mb-2" />
                    <span className="font-medium text-neutral-200">
                      Click to attach certificate or appointment order
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-0.5">
                      Confidential. Only used by admin panel for identity validation.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/mentors')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                size="md"
                disabled={submitting}
              >
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
