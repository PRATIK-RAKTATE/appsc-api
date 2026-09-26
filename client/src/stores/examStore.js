import { create } from 'zustand';
import api from '../services/api';

export const useExamStore = create((set, get) => ({
  attemptId: null,
  testId: null,
  testTitle: '',
  durationMinutes: 150,
  remainingSeconds: 9000,
  questions: [],
  currentIndex: 0,
  responses: {}, // { [qId]: { selectedOption: number|null, status: 'NOT_VISITED'|'UNANSWERED'|'ANSWERED'|'REVIEW', timeSpent: number } }
  language: 'en', // 'en' | 'te'
  isSubmitting: false,
  isExpired: false,

  // Start Exam Session
  startExam: async (testId) => {
    try {
      const response = await api.post(`/exams/${testId}/start`);
      if (response.data.success) {
        const { attemptId, durationMinutes, expiresAt, questions, testTitle } = response.data.data;
        const totalSecs = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000)) || durationMinutes * 60;

        // Initialize question responses state
        const initialResponses = {};
        (questions || []).forEach((q, idx) => {
          initialResponses[q._id] = {
            selectedOption: null,
            status: idx === 0 ? 'UNANSWERED' : 'NOT_VISITED',
            timeSpent: 0,
          };
        });

        // Check local storage backup if resumed
        const backupKey = `exam_backup_${attemptId}`;
        const localBackup = localStorage.getItem(backupKey);
        let finalResponses = initialResponses;
        if (localBackup) {
          try {
            finalResponses = { ...initialResponses, ...JSON.parse(localBackup) };
          } catch (e) {}
        }

        set({
          attemptId,
          testId,
          testTitle: testTitle || 'APPSC Mock Examination',
          durationMinutes,
          remainingSeconds: totalSecs,
          questions: questions || [],
          currentIndex: 0,
          responses: finalResponses,
          isExpired: false,
        });

        return { success: true, attemptId };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not start exam' };
    }
  },

  // Select an option for the current question
  selectOption: (questionId, optionId) => {
    const { responses, attemptId } = get();
    const current = responses[questionId] || {};
    const updated = {
      ...responses,
      [questionId]: {
        ...current,
        selectedOption: optionId,
        status: 'ANSWERED',
      },
    };
    set({ responses: updated });
    // Local backup
    localStorage.setItem(`exam_backup_${attemptId}`, JSON.stringify(updated));
    // Trigger background autosave
    get().autosaveSingle(questionId);
  },

  // Clear selected response
  clearResponse: (questionId) => {
    const { responses, attemptId } = get();
    const current = responses[questionId] || {};
    const updated = {
      ...responses,
      [questionId]: {
        ...current,
        selectedOption: null,
        status: 'UNANSWERED',
      },
    };
    set({ responses: updated });
    localStorage.setItem(`exam_backup_${attemptId}`, JSON.stringify(updated));
    get().autosaveSingle(questionId);
  },

  // Mark for Review & Next
  markForReview: (questionId) => {
    const { responses, attemptId, currentIndex, questions } = get();
    const current = responses[questionId] || {};
    const updated = {
      ...responses,
      [questionId]: {
        ...current,
        status: 'REVIEW',
      },
    };
    set({ responses: updated });
    localStorage.setItem(`exam_backup_${attemptId}`, JSON.stringify(updated));
    get().autosaveSingle(questionId);

    // Auto advance to next
    if (currentIndex < questions.length - 1) {
      get().setCurrentIndex(currentIndex + 1);
    }
  },

  // Save & Next
  saveAndNext: (questionId) => {
    const { currentIndex, questions } = get();
    get().autosaveSingle(questionId);
    if (currentIndex < questions.length - 1) {
      get().setCurrentIndex(currentIndex + 1);
    }
  },

  // Autosave single question response to server
  autosaveSingle: async (questionId) => {
    const { attemptId, responses } = get();
    if (!attemptId || !questionId) return;

    const res = responses[questionId];
    try {
      const response = await api.patch(`/exams/attempts/${attemptId}/autosave`, {
        questionId,
        selectedOption: res?.selectedOption,
        status: res?.status,
        timeSpentSeconds: res?.timeSpent || 0,
      });

      if (response.data.expired) {
        set({ isExpired: true });
      }
    } catch (err) {
      console.warn('Autosave failed:', err);
    }
  },

  // Submit Exam
  submitExam: async () => {
    const { attemptId } = get();
    set({ isSubmitting: true });
    try {
      const response = await api.post(`/exams/attempts/${attemptId}/submit`);
      set({ isSubmitting: false });
      localStorage.removeItem(`exam_backup_${attemptId}`);
      return { success: true, data: response.data };
    } catch (err) {
      set({ isSubmitting: false });
      return { success: false, message: err.message };
    }
  },

  // Toggle bilingual language (EN <-> TE)
  toggleLanguage: () => {
    set((state) => ({ language: state.language === 'en' ? 'te' : 'en' }));
  },

  // Navigate question index
  setCurrentIndex: (index) => {
    const { questions, responses } = get();
    const q = questions[index];
    if (q && responses[q._id]?.status === 'NOT_VISITED') {
      set((state) => ({
        currentIndex: index,
        responses: {
          ...state.responses,
          [q._id]: {
            ...state.responses[q._id],
            status: 'UNANSWERED',
          },
        },
      }));
    } else {
      set({ currentIndex: index });
    }
  },

  // Timer Tick
  tickTimer: () => {
    const { remainingSeconds } = get();
    if (remainingSeconds <= 1) {
      set({ remainingSeconds: 0, isExpired: true });
      get().submitExam();
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },
}));
