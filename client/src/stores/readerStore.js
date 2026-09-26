import { create } from 'zustand';
import api from '../services/api';

export const useReaderStore = create((set, get) => ({
  bookId: null,
  book: null,
  chapters: [],
  blocks: [],
  currentChapterId: null,
  theme: 'dark', // 'light' | 'dark' | 'sepia'
  fontSize: 16, // px (14 - 26)
  isSearchOpen: false,
  isNotesDrawerOpen: false,
  annotations: [],
  searchQuery: '',
  searchResults: [],
  isLoading: false,

  // Fetch reader content blocks for a book
  fetchReaderBook: async (bookId, chapterId = null) => {
    set({ isLoading: true, bookId });
    try {
      const response = await api.get(`/books/${bookId}/reader`, {
        params: chapterId ? { chapterId } : {},
      });
      if (response.data.success) {
        const { book, chapters, blocks } = response.data;
        set({
          book,
          chapters: chapters || [],
          blocks: blocks || [],
          currentChapterId: chapterId || chapters?.[0]?._id || null,
          isLoading: false,
        });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  // Save reading progress to MongoDB
  saveProgress: async (bookId, chapterId, blockIndex, percentComplete) => {
    try {
      await api.put(`/books/${bookId}/progress`, {
        chapterId,
        blockIndex,
        percentComplete,
      });
    } catch (err) {
      console.warn('Could not auto-save reading progress:', err);
    }
  },

  // Fetch user annotations for the current book
  fetchAnnotations: async (bookId) => {
    try {
      const response = await api.get(`/annotations/book/${bookId}`);
      if (response.data.success) {
        set({ annotations: response.data.data || [] });
      }
    } catch (err) {
      console.warn('Could not fetch annotations:', err);
    }
  },

  // Create an annotation (Highlight / Note / Bookmark)
  createAnnotation: async (annotationData) => {
    try {
      const response = await api.post('/annotations', annotationData);
      if (response.data.success) {
        set((state) => ({
          annotations: [...state.annotations, response.data.data],
        }));
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // Delete annotation
  deleteAnnotation: async (id) => {
    try {
      await api.delete(`/annotations/${id}`);
      set((state) => ({
        annotations: state.annotations.filter((a) => a._id !== id),
      }));
    } catch (err) {
      console.warn('Could not delete annotation:', err);
    }
  },

  // Search book content blocks
  searchBook: async (bookId, query) => {
    if (!query?.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const response = await api.get(`/books/${bookId}/search`, {
        params: { query },
      });
      if (response.data.success) {
        set({ searchResults: response.data.matches || [] });
      }
    } catch (err) {
      set({ searchResults: [] });
    }
  },

  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setNotesDrawerOpen: (isNotesDrawerOpen) => set({ isNotesDrawerOpen }),
  setCurrentChapterId: (currentChapterId) => set({ currentChapterId }),
}));
