# APPSC Prep — UI Architecture, API Mapping & Moving Plan

This directory contains the complete blueprint, page inventory, backend API mapping, and sequential moving plan for achieving **100% completion** of the **APPSC Prep Web Application** (React.js + Tailwind CSS v4).

All specifications directly cross-reference:
- **The 24 Web Issues** documented in [`web-issues.json`](file:///home/pratik/d/arobix/appsc-api/web-issues.json)
- **The 123 Server REST APIs & Socket.IO Gateway** located in [`server/src/modules`](file:///home/pratik/d/arobix/appsc-api/server/src/modules)
- **The Core Statement of Work (SOW)** located in [`docs/requirements/appsc-sow.html`](file:///home/pratik/d/arobix/appsc-api/docs/requirements/appsc-sow.html)

---

## 📊 High-Level Metric Summary

| Metric | Count | Details |
| :--- | :--- | :--- |
| **Total Web Issues Addressed** | **24 / 24** | 100% coverage of all `[Web]` labeled GitHub issues |
| **Total Backend REST Endpoints** | **123** | Across all 15 backend feature modules + `/health` |
| **Socket.IO Event Handlers** | **13 Events** | Real-time chat messaging, presence, typing, & session termination |
| **Total Application Pages** | **31 Pages** | 4 Public/Auth + 13 Student + 3 Mentor + 11 Admin |
| **Global Interactive Overlays** | **2 Overlays** | AI Study Assistant Drawer (KaTeX + Citations) & Dynamic DRM Watermark |
| **User Personas / Roles** | **3 Roles** | `STUDENT`, `MENTOR`, `ADMIN` (plus unauthenticated public) |
| **Target Frontend Stack** | **Modern React** | React 18/19, Vite, Tailwind CSS v4, Lucide Icons, Socket.io-client, KaTeX, TanStack Query |

---

## 📁 Documentation Structure

```text
ui_requred/
├── README.md                      # Master Blueprint & Executive Summary (This file)
├── API_INVENTORY.md               # Exhaustive catalogue of all 123 backend endpoints & payload schemas
├── PAGE_INVENTORY.md              # Complete matrix of all 31 pages + 2 overlays with API mappings
├── MOVING_PLAN.md                 # Step-by-step phased execution plan to achieve 100% UI completion
├── COMPONENTS_AND_ROUTING.md      # React component architecture, routing trees, and state stores
└── specs/                         # Detailed technical specifications by portal:
    ├── 01_AUTH_AND_SECURITY.md    # Login, OTP, RBAC Route Guards, Session Kill & DRM Protections
    ├── 02_STUDENT_PAGES.md        # Dashboard, Bilingual Reader, Exam Player, Analytics, Current Affairs
    ├── 03_MENTOR_PAGES.md         # Mentor Dashboard, Application, 1-on-1 Student Chat, Video Uploader
    └── 04_ADMIN_PAGES.md          # Admin CMS, User Directory, Question Bank, Test & Course Builders, Audit
```

---

## 🎯 Executive Summary of Web Issues Mapped

Every issue from [`web-issues.json`](file:///home/pratik/d/arobix/appsc-api/web-issues.json) is mapped to its specific page, component, and API endpoint:

| Issue # | Task ID | Title / Feature | Target Page / Component | Key API / Socket Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **#9** | TASK-01.1.4 | Responsive Web Login & OTP Verification | `LoginPage` | `POST /api/auth/send-otp`, `POST /api/auth/verify-otp` |
| **#13** | TASK-01.2.2 | React Route Guards & RBAC Protection | `ProtectedRoute`, `RoleGuard` | Client router & `GET /api/auth/me` |
| **#16** | TASK-01.3.3 | Session Termination Listener & Modal | `SessionTerminationModal` | Socket.io: `session_revoked` event |
| **#19** | TASK-01.4.2 | Anti-Copy DRM Protection Layer | `ContentProtectionWrapper` | Client-side DOM event interception |
| **#20** | TASK-01.4.3 | Floating Student Watermark Overlay | `WatermarkOverlay` | Canvas / SVG overlay with user context |
| **#24** | TASK-02.1.4 | Admin Book Manager & Translation Review | `AdminBookManagerPage` | `POST /api/books/upload-url`, `GET/PUT /api/books` |
| **#26** | TASK-02.2.2 | Dual-Pane Bilingual Reader (Sync Scroll) | `BilingualReaderPage` | `GET /api/books/:id/reader`, `PUT /progress` |
| **#31** | TASK-02.3.3 | Text Selection Annotation & Highlighter | `AnnotationPopover`, `NotesDrawer` | `GET/POST/PATCH/DELETE /api/annotations` |
| **#34** | TASK-02.4.2 | In-Reader Full-Text Search Drawer | `ReaderSearchDrawer` | `GET /api/books/:bookId/search` |
| **#38** | TASK-03.1.4 | Admin Question Bank & Bulk Import | `AdminQuestionBankPage` | `POST /api/questions/import/json`, `csv` |
| **#41** | TASK-03.2.3 | Admin Test Builder with Question Selector | `AdminTestBuilderPage` | `POST /api/tests`, `GET /api/questions` |
| **#43** | TASK-03.3.2 | Web Exam Player (Palette & Timer) | `ExamPlayerPage` | `POST /api/exams/:id/start`, `PATCH /autosave` |
| **#48** | TASK-03.4.3 | Test Scorecard & Hourly Leaderboards | `TestScorecardPage` | `POST /api/exams/attempts/:id/submit` |
| **#51** | TASK-03.5.3 | Student Analytics & Weak Topic Diagnosis | `StudentAnalyticsPage` | `GET /api/exams/attempts/:id/analytics` |
| **#52** | TASK-03.5.4 | Question-by-Question Solution Review | `SolutionReviewPage` | `GET /api/exams/attempts/:id/review` |
| **#55** | TASK-04.1.3 | Mentor Approval Portal & Student Directory | `MentorDirectoryPage`, `AdminMentorsPage` | `GET /api/mentors`, `PATCH /api/admin/mentors/:id/status` |
| **#58** | TASK-04.2.3 | 1-on-1 Real-time Chat UI | `ChatRoomPage` | Socket.io: `send_message`, `receive_message` |
| **#61** | TASK-04.3.2 | In-Chat Image/PDF Uploader & Lightbox | `ChatAttachmentModal`, `Lightbox` | `GET /api/videos/signed-url` (R2 upload) |
| **#65** | TASK-04.4.3 | Report Modal & Admin Chat Moderation | `ReportModal`, `AdminChatModerationPage` | `POST /api/chat/reports`, `GET/PATCH /api/admin/chat` |
| **#71** | TASK-05.2.3 | AI Chat Drawer (Markdown, KaTeX, Citations)| `AiAssistantDrawer` (Global Widget) | `POST /api/ai/vector-search` |
| **#77** | TASK-05.4.2 | Admin AI Settings & Index Status | `AdminAiSettingsPage` | `GET/PUT /admin/ai-settings`, `POST /reindex` |
| **#80** | TASK-06.1.3 | Admin Current Affairs Editor & Scheduler | `AdminCurrentAffairsEditorPage` | `POST /api/admin/current-affairs` |
| **#82** | TASK-06.2.2 | Related Syllabus Concepts Card Component | `RelatedSyllabusCard` | `GET /api/current-affairs/:id` |
| **#84** | TASK-06.3.2 | Current Affairs Feed, Filters & Reader | `CurrentAffairsFeedPage`, `ArticleReaderPage` | `GET /api/current-affairs`, `POST /bookmarks` |
| **#89** | TASK-07.1.3 | Admin Course Builder UI | `AdminCourseBuilderPage` | `POST /api/admin/courses`, `PUT /curriculum` |
| **#90** | TASK-07.1.4 | Student Course Catalog & Course Details | `CourseCatalogPage`, `CourseDetailsPage` | `GET /api/admin/courses`, `GET /:id` |
| **#92** | TASK-07.2.2 | HTML5 Video Player with Speed & Autosave | `VideoLecturePlayerPage` | `GET /api/videos/signed-url` |
| **#96** | TASK-07.3.3 | Razorpay Standard Checkout Integration | `CheckoutPage` | `POST /api/payments/create-order`, `verify` |
| **#100** | TASK-07.4.3 | Enrolled Courses with Validity Countdown | `StudentDashboardPage` | `GET /api/admin/courses`, Entitlements |
| **#103** | TASK-07.5.3 | Coupon Input, Invoice Download & Refunds | `CheckoutPage`, `InvoicesPage`, `AdminRefunds`| `POST /coupons/validate`, `GET /invoice`, `POST /refunds` |
| **#106** | TASK-08.1.2 | Admin User Directory & Inspector UI | `AdminUsersPage`, `UserInspectorDrawer` | `GET /api/admin/users`, `POST /revoke-sessions` |
| **#109** | TASK-08.2.3 | Admin Audit Logs Viewer & Delta Inspector | `AdminAuditLogsPage` | `GET /api/admin/chat/audit-logs`, Audit middleware |

---

## 🚀 Recommended Immediate Next Steps

1. Review [`PAGE_INVENTORY.md`](file:///home/pratik/d/arobix/appsc-api/ui_requred/PAGE_INVENTORY.md) to inspect every page's layout, route, and data contract.
2. Review [`API_INVENTORY.md`](file:///home/pratik/d/arobix/appsc-api/ui_requred/API_INVENTORY.md) for the exact payload formats of all 123 endpoints.
3. Execute the implementation steps outlined in [`MOVING_PLAN.md`](file:///home/pratik/d/arobix/appsc-api/ui_requred/MOVING_PLAN.md) to initialize the `client/` Vite application and incrementally build out each phase.
