import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Phase 1 Pages
import { LoginPage } from './pages/auth/LoginPage';
import { AccessDeniedPage } from './pages/auth/AccessDeniedPage';
import { NotFoundPage } from './pages/auth/NotFoundPage';

// Phase 2 Pages
import { LandingPage } from './pages/home/LandingPage';
import { CourseCatalogPage } from './pages/courses/CourseCatalogPage';
import { CourseDetailsPage } from './pages/courses/CourseDetailsPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentInvoicesPage } from './pages/student/StudentInvoicesPage';

// Phase 3 Pages (Bilingual E-Book Reader)
import { BilingualReaderPage } from './pages/reader/BilingualReaderPage';

// Phase 4 Pages (Examination & Assessment Engine)
import { StudentTestsCatalogPage } from './pages/exams/StudentTestsCatalogPage';
import { ExamPlayerPage } from './pages/exams/ExamPlayerPage';
import { TestScorecardPage } from './pages/exams/TestScorecardPage';
import { SolutionReviewPage } from './pages/exams/SolutionReviewPage';
import { StudentAnalyticsPage } from './pages/exams/StudentAnalyticsPage';

// Phase 5 Pages (Daily Current Affairs & Semantic Linking)
import { CurrentAffairsFeedPage } from './pages/current-affairs/CurrentAffairsFeedPage';
import { ArticleReaderPage } from './pages/current-affairs/ArticleReaderPage';
import { AdminCurrentAffairsPage } from './pages/admin/AdminCurrentAffairsPage';

// Phase 6 Pages (1-on-1 Mentor Communication Subsystem)
import { MentorDirectoryPage } from './pages/mentors/MentorDirectoryPage';
import { MentorApplicationPage } from './pages/mentors/MentorApplicationPage';
import { MentorDashboardPage } from './pages/mentor/MentorDashboardPage';
import { ChatRoomPage } from './pages/chat/ChatRoomPage';
import { AdminMentorApprovalsPage } from './pages/admin/AdminMentorApprovalsPage';
import { AdminChatModerationPage } from './pages/admin/AdminChatModerationPage';

// Phase 7 Pages (AI Assistant & Admin Governance)
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAiSettingsPage } from './pages/admin/AdminAiSettingsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

export function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Fullscreen Dedicated Viewports without standard navbar */}
        <Route path="/student/books/:bookId" element={<BilingualReaderPage />} />
        <Route path="/student/exams/:attemptId" element={<ExamPlayerPage />} />

        {/* Standard Application Layout Routes */}
        <Route element={<AppLayout />}>
          {/* Public Exploration & Catalog */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<LandingPage />} />
          <Route path="/courses" element={<CourseCatalogPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Phase 5: Daily Current Affairs Routes */}
          <Route path="/current-affairs" element={<CurrentAffairsFeedPage />} />
          <Route path="/current-affairs/:id" element={<ArticleReaderPage />} />
          <Route path="/student/current-affairs" element={<CurrentAffairsFeedPage />} />
          <Route path="/student/current-affairs/:id" element={<ArticleReaderPage />} />

          {/* Phase 6: Mentor Subsystem Routes */}
          <Route path="/mentors" element={<MentorDirectoryPage />} />
          <Route path="/mentor/apply" element={<MentorApplicationPage />} />
          <Route path="/mentor-apply" element={<MentorApplicationPage />} />
          <Route path="/mentor/dashboard" element={<MentorDashboardPage />} />
          <Route path="/chat" element={<ChatRoomPage />} />
          <Route path="/chat/:threadId" element={<ChatRoomPage />} />

          {/* Assessment & Learning Routes */}
          <Route path="/student/tests" element={<StudentTestsCatalogPage />} />
          <Route path="/student/exams/:attemptId/scorecard" element={<TestScorecardPage />} />
          <Route path="/student/exams/:attemptId/review" element={<SolutionReviewPage />} />
          <Route path="/student/analytics" element={<StudentAnalyticsPage />} />

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout/:courseId" element={<CheckoutPage />} />
            <Route path="/student/dashboard" element={<StudentDashboardPage />} />
            <Route path="/student/invoices" element={<StudentInvoicesPage />} />
          </Route>

          {/* Admin Governance Subsystem Routes */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/current-affairs" element={<AdminCurrentAffairsPage />} />
          <Route path="/admin/mentors" element={<AdminMentorApprovalsPage />} />
          <Route path="/admin/chat/moderation" element={<AdminChatModerationPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/ai-settings" element={<AdminAiSettingsPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />

          {/* Error Fallback Routes */}
          <Route path="/403" element={<AccessDeniedPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
