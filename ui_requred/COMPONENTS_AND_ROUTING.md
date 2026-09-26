# Frontend Component Architecture & Routing Specifications

This document defines the React component hierarchy, client-side routing structure, state management stores, and shared UI component library for the **APPSC Prep** web application.

---

## 🌳 Layouts & Routing Hierarchy

The application utilizes nested layouts in `react-router-dom` to enforce layout consistency and role boundaries.

```text
<App>
  ├── <WatermarkOverlay /> (Global DRM Canvas)
  ├── <SessionTerminationModal /> (Global Socket Listener)
  ├── <AiAssistantDrawer /> (Global Floating Widget)
  └── <Routes>
        ├── Public Routes (PublicLayout)
        │   ├── / -> <LandingPage />
        │   ├── /explore -> <CourseCatalogPage />
        │   ├── /courses/:courseId -> <CourseDetailsPage />
        │   └── /mentor-apply -> <MentorApplicationPage />
        │
        ├── Auth Routes (AuthLayout)
        │   └── /login -> <LoginPage />
        │
        ├── Student Protected Routes (StudentLayout - Role: STUDENT)
        │   ├── /student/dashboard -> <StudentDashboardPage />
        │   ├── /student/courses -> <StudentCoursesPage />
        │   ├── /checkout/:courseId -> <CheckoutPage />
        │   ├── /student/invoices -> <StudentInvoicesPage />
        │   ├── /student/courses/:courseId/video/:videoId -> <VideoLecturePlayerPage />
        │   ├── /student/tests -> <StudentTestsCatalogPage />
        │   ├── /student/exams/:attemptId/scorecard -> <TestScorecardPage />
        │   ├── /student/exams/:attemptId/review -> <SolutionReviewPage />
        │   ├── /student/analytics -> <StudentAnalyticsPage />
        │   ├── /student/current-affairs -> <CurrentAffairsFeedPage />
        │   ├── /student/current-affairs/:id -> <ArticleReaderPage />
        │   ├── /student/mentors -> <MentorDirectoryPage />
        │   └── /student/mentors/chat/:threadId -> <ChatRoomPage />
        │
        ├── Distraction-Free Student Routes (Specialized Layouts - Role: STUDENT)
        │   ├── /student/books/:bookId -> <ReaderLayout><BilingualReaderPage /></ReaderLayout>
        │   └── /student/exams/:attemptId -> <ExamPlayerLayout><ExamPlayerPage /></ExamPlayerLayout>
        │
        ├── Mentor Protected Routes (MentorLayout - Role: MENTOR)
        │   ├── /mentor/dashboard -> <MentorDashboardPage />
        │   ├── /mentor/chat -> <ChatRoomPage />
        │   ├── /mentor/chat/:threadId -> <ChatRoomPage />
        │   └── /mentor/content -> <MentorContentUploadPage />
        │
        ├── Admin Protected Routes (AdminLayout - Role: ADMIN, SUPER_ADMIN)
        │   ├── /admin/dashboard -> <AdminDashboardPage />
        │   ├── /admin/users -> <AdminUsersPage />
        │   ├── /admin/mentors -> <AdminMentorsPage />
        │   ├── /admin/books -> <AdminBookManagerPage />
        │   ├── /admin/questions -> <AdminQuestionBankPage />
        │   ├── /admin/tests/builder -> <AdminTestBuilderPage />
        │   ├── /admin/courses/builder -> <AdminCourseBuilderPage />
        │   ├── /admin/current-affairs -> <AdminCurrentAffairsListPage />
        │   ├── /admin/current-affairs/new -> <AdminCurrentAffairsEditorPage />
        │   ├── /admin/current-affairs/edit/:id -> <AdminCurrentAffairsEditorPage />
        │   ├── /admin/ai-settings -> <AdminAiSettingsPage />
        │   ├── /admin/chat/moderation -> <AdminChatModerationPage />
        │   ├── /admin/chat/audit -> <AdminChatAuditPage />
        │   ├── /admin/financials -> <AdminFinancialsPage />
        │   ├── /admin/audit-logs -> <AdminAuditLogsPage />
        │   └── /admin/settings -> <AdminPlatformSettingsPage />
        │
        └── Fallback Routes (ErrorLayout)
            ├── /403 -> <AccessDeniedPage />
            └── * -> <NotFoundPage />
```

---

## 🗄️ State Management Architecture (Zustand Stores)

The application uses lightweight, reactive **Zustand** stores for global UI state, combined with **TanStack React Query** for server-state caching.

### 1. `useAuthStore`
- **File:** `src/stores/authStore.js`
- **State:**
  - `user`: `{ _id, email, fullName, role, avatarUrl, status } | null`
  - `accessToken`: `string | null`
  - `refreshToken`: `string | null`
  - `isAuthenticated`: `boolean`
  - `isSessionRevoked`: `boolean`
- **Actions:**
  - `setAuth(tokens, user)`: Persists tokens to memory & `localStorage`, initializes Socket.io connection.
  - `clearAuth()`: Purges tokens, resets user state, closes socket connection.
  - `triggerSessionRevoked()`: Sets `isSessionRevoked: true` to trigger termination modal.

### 2. `useExamStore`
- **File:** `src/stores/examStore.js`
- **State:**
  - `attemptId`: `string | null`
  - `test`: `TestObject | null`
  - `responses`: `Record<questionId, { selectedOption, status, timeSpentSeconds }>`
  - `currentQuestionIndex`: `number`
  - `language`: `"en" | "te"` (Current bilingual toggle)
  - `remainingSeconds`: `number`
  - `isSubmitting`: `boolean`
- **Actions:**
  - `setAnswer(questionId, optionId)`
  - `toggleReview(questionId)`
  - `toggleLanguage()`
  - `decrementTimer()`
  - `syncAutosave()`

### 3. `useReaderStore`
- **File:** `src/stores/readerStore.js`
- **State:**
  - `bookId`: `string | null`
  - `theme`: `"light" | "dark" | "sepia"`
  - `fontSize`: `number` (14 to 26)
  - `scrollRatio`: `number` (For dual-pane synchronization)
  - `isSearchOpen`: `boolean`
  - `isNotesDrawerOpen`: `boolean`
  - `activeAnnotations`: `Array<Annotation>`
- **Actions:**
  - `setTheme(theme)`
  - `setFontSize(size)`
  - `setAnnotations(list)`
  - `addAnnotation(annotation)`

### 4. `useChatStore`
- **File:** `src/stores/chatStore.js`
- **State:**
  - `activeThreadId`: `string | null`
  - `threads`: `Array<ThreadSummary>`
  - `messages`: `Record<threadId, Array<ChatMessage>>`
  - `totalUnreadCount`: `number`
  - `isTyping`: `Record<threadId, boolean>`
- **Actions:**
  - `setActiveThread(id)`
  - `addMessage(threadId, message)`
  - `setDelivered(threadId, messageIds)`
  - `setRead(threadId, messageIds)`

---

## 🧩 Shared Reusable UI Component Library

All reusable components live under `src/components/ui/` and are built using Tailwind CSS v4 utility classes:

| Component Name | Description | Key Props / Variants |
|---|---|---|
| `Button` | Primary, secondary, outline, danger, ghost buttons with loading spinners | `variant`, `size`, `isLoading`, `icon` |
| `Input` | Styled text input with error messages and floating labels | `label`, `error`, `helperText`, `icon` |
| `Badge` | Pill badges for validity, exam statuses, roles | `variant: "success" \| "warning" \| "danger" \| "info" \| "neutral"` |
| `Modal` | Accessible backdrop modal with keyboard trap and animations | `isOpen`, `onClose`, `title`, `footer` |
| `Drawer` | Slide-out side drawer for inspectors, notes, and search | `isOpen`, `onClose`, `position: "left" \| "right"` |
| `DataTable` | Filterable, sortable, paginated data grid | `columns`, `data`, `isLoading`, `pagination`, `onRowClick` |
| `Tabs` | Tab bar navigation with animated active underline | `tabs: Array<{ id, label, icon }>`, `activeTab`, `onChange` |
| `Dropdown` | Accessible menu dropdown for actions and options | `trigger`, `items: Array<{ label, icon, onClick, danger }>` |
| `Toast` | Notifications for success, error, warning states | `type`, `message`, `duration` |
| `KaTeXRenderer` | LaTeX math formula parser and renderer | `math: string`, `inline: boolean` |
| `WatermarkOverlay` | Dynamic anti-duplication floating SVG watermark canvas | `userEmail`, `userId`, `timestamp` |
| `ContentProtection` | Wrapper intercepting right-clicks, copying, and printing | `children`, `disableCopy: boolean`, `disableContextMenu: boolean` |
