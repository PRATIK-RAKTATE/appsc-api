# Complete Application Page Inventory & Route Matrix

This document provides a detailed breakdown of all **31 Pages** and **2 Global Interactive Overlays** required to construct the complete **APPSC Prep** platform, categorized by user persona and functional area.

---

## 🧭 Page Architecture & Role Matrix

```text
├── PUBLIC & AUTHENTICATION (4 Pages)
│   ├── [P-01] Landing & Public Exploration (/ or /explore)
│   ├── [P-02] Login & Email OTP Verification (/login)
│   ├── [P-03] Mentor Application Onboarding (/mentor-apply)
│   └── [P-04] Error States & Access Denied (/403, /404)
│
├── STUDENT PORTAL (13 Pages)
│   ├── [S-01] Student Dashboard & Enrolled Courses (/student/dashboard)
│   ├── [S-02] Course Catalog & Search (/student/courses)
│   ├── [S-03] Course Details & Curriculum Breakdown (/courses/:courseId)
│   ├── [S-04] Checkout & Razorpay Payment Modal (/checkout/:courseId)
│   ├── [S-05] Billing & Invoices Ledger (/student/invoices)
│   ├── [S-06] Synchronized Dual-Pane Bilingual E-Book Reader (/student/books/:bookId)
│   ├── [S-07] Cloudflare R2 Video Lecture Player (/student/courses/:courseId/video/:videoId)
│   ├── [S-08] Mock Tests & Test Series Catalog (/student/tests)
│   ├── [S-09] Distraction-Free Online Exam Player (/student/exams/:attemptId)
│   ├── [S-10] Post-Submission Scorecard & Hourly Leaderboard (/student/exams/:attemptId/scorecard)
│   ├── [S-11] Question-by-Question Solution Review (/student/exams/:attemptId/review)
│   ├── [S-12] Student Analytics & Weak Topic Diagnosis (/student/analytics)
│   └── [S-13] Daily Current Affairs Feed & Article Reader (/student/current-affairs, /:id)
│
├── MENTOR PORTAL (3 Pages)
│   ├── [M-01] Mentor Dashboard & Query Inbox (/mentor/dashboard)
│   ├── [M-02] 1-on-1 Real-Time Doubt Resolution Chat (/mentor/chat, /:threadId)
│   └── [M-03] Mentor Video Lecture & Resource Uploader (/mentor/content)
│
├── ADMIN GOVERNANCE PORTAL (11 Pages)
│   ├── [A-01] Admin Platform Analytics Dashboard (/admin/dashboard)
│   ├── [A-02] Student & Mentor User Directory & Inspector (/admin/users)
│   ├── [A-03] Mentor Approval & Review Portal (/admin/mentors)
│   ├── [A-04] Book Manager & Translation Review CMS (/admin/books)
│   ├── [A-05] Question Bank & Bulk Import CMS (/admin/questions)
│   ├── [A-06] Test Builder & Rules Configuration Wizard (/admin/tests/builder)
│   ├── [A-07] Course Builder & Curriculum Bundler (/admin/courses/builder)
│   ├── [A-08] Daily Current Affairs Editor & Scheduler (/admin/current-affairs)
│   ├── [A-09] AI RAG Settings & Knowledge Re-indexing (/admin/ai-settings)
│   ├── [A-10] Chat Moderation & Audit Archive Explorer (/admin/chat/moderation, /audit)
│   └── [A-11] Financial Manager, Refunds & Audit Logs (/admin/financials, /settings)
│
└── GLOBAL SYSTEM OVERLAYS (2 Overlays)
    ├── [G-01] Global AI Study Assistant Drawer (LaTeX KaTeX & Book Citations)
    └── [G-02] Dynamic Student Watermark & Single-Session Eviction Listener
```

---

## 🏛️ Area 1: Public & Authentication Pages

### [P-01] Landing & Course Discovery
- **Route:** `/` or `/explore`
- **Layout:** `PublicLayout` (Minimal header, APPSC branding, navigation links, login CTA)
- **Primary Persona:** Public / Unauthenticated visitors & Prospective Students
- **Issue Reference:** SOW Section 2
- **Key Features & UI Elements:**
  - Hero section showcasing APPSC Group 1, Group 2, and Group 3 exam prep materials
  - Featured Course Cards with pricing, validity tags, and syllabus previews
  - Daily Current Affairs banner with today's headlines
  - "Bilingual First" highlight (side-by-side English/Telugu reader demo)
- **Consumed APIs:**
  - `GET /api/admin/courses?status=PUBLISHED`
  - `GET /api/current-affairs?limit=5`

---

### [P-02] Login & Email OTP Verification
- **Route:** `/login`
- **Layout:** `AuthLayout` (Clean split-screen with APPSC illustration and interactive form)
- **Primary Persona:** Students, Mentors, and Administrators
- **Issue Reference:** `web-issues.json` #9 ([TASK-01.1.4])
- **Key Features & UI Elements:**
  - Step 1: Email input with format validation and role hint
  - Step 2: 6-digit individual OTP input boxes with auto-focus shifting
  - 10-minute expiry countdown timer (`10:00` -> `00:00`)
  - Resend OTP button with 60s cooldown and rate-limit guard (max 3 dispatches per 15 min)
  - Post-verification automatic redirection: `STUDENT` -> `/student/dashboard`, `MENTOR` -> `/mentor/dashboard`, `ADMIN` -> `/admin/dashboard`
- **Consumed APIs:**
  - `POST /api/auth/send-otp`
  - `POST /api/auth/verify-otp`

---

### [P-03] Mentor Application Onboarding
- **Route:** `/mentor-apply`
- **Layout:** `PublicLayout`
- **Primary Persona:** Prospective Mentors / Educators
- **Issue Reference:** `web-issues.json` #55 ([TASK-04.1.3])
- **Key Features & UI Elements:**
  - Application form collecting Full Name, Subject Expertise multi-select tags, Academic Credentials, Bio, and LinkedIn URL
  - Document upload for identity or teaching verification
  - Application confirmation modal with pending status notice
- **Consumed APIs:**
  - `POST /api/mentors/apply`
  - `GET /api/subjects`

---

### [P-04] Error States & Access Denied
- **Route:** `/403` (Access Denied), `/404` (Not Found)
- **Layout:** `ErrorLayout`
- **Primary Persona:** All Users
- **Issue Reference:** `web-issues.json` #13 ([TASK-01.2.2])
- **Key Features & UI Elements:**
  - 403: "Unauthorized Role Access" warning when a Student tries accessing `/admin/*` or a Mentor accesses unauthorized content
  - 404: "Page Not Found" with quick links back to Dashboard
  - "Switch Account" or "Return Home" action buttons

---

## 🎓 Area 2: Student Portal Pages

### [S-01] Student Dashboard & Enrolled Courses
- **Route:** `/student/dashboard`
- **Layout:** `StudentLayout` (Sidebar with quick links, unread doubt counters, global search)
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #100 ([TASK-07.4.3])
- **Key Features & UI Elements:**
  - Grid of actively enrolled course packages
  - Remaining validity days badge with color coding (Green > 14 days, Orange 7-14 days, Red < 7 days)
  - One-click renewal alerts for expiring courses
  - "Continue Learning" widget (quick-resume last read e-book chapter and last watched video)
  - Recent test score summary widget
- **Consumed APIs:**
  - `GET /api/auth/me`
  - `GET /api/admin/courses`
  - `GET /api/books/:id/progress`

---

### [S-02] Student Course Catalog & Filters
- **Route:** `/student/courses`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #90 ([TASK-07.1.4])
- **Key Features & UI Elements:**
  - Course card grid with filters: Exam Stage (Prelims / Mains), Subject, Price, Validity
  - Course thumbnail, title, validity period badge, included book & test count
  - Instant search bar with debounced query
- **Consumed APIs:**
  - `GET /api/admin/courses?status=PUBLISHED`
  - `GET /api/subjects`

---

### [S-03] Course Details & Curriculum Breakdown
- **Route:** `/courses/:courseId`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #90 ([TASK-07.1.4])
- **Key Features & UI Elements:**
  - Comprehensive course overview with syllabus coverage description
  - Curriculum Accordion:
    - Section 1: Bilingual E-Books (Chapters, page count, preview button)
    - Section 2: Video Lectures (Topics, duration, preview trailer)
    - Section 3: Test Series (Mock exams, questions, negative marking rules)
  - Sticky Pricing Card: Base price, discounted price, validity in days, "Enroll Now" CTA
- **Consumed APIs:**
  - `GET /api/admin/courses/:id`

---

### [S-04] Checkout & Razorpay Payment Modal
- **Route:** `/checkout/:courseId`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #96 ([TASK-07.3.3]), #103 ([TASK-07.5.3])
- **Key Features & UI Elements:**
  - Order summary displaying course name, validity period, and base price
  - Interactive Coupon Code Input widget:
    - Real-time validation against backend (`POST /api/payments/coupons/validate`)
    - Shows discount percentage/flat amount and recalculated total
  - Razorpay Standard Checkout button:
    - Initializes Razorpay SDK modal via order created on backend
    - Handles payment success callback and server signature verification
  - Success screen with Order ID, transaction receipt, and "Go to Dashboard" button
- **Consumed APIs:**
  - `POST /api/payments/create-order`
  - `POST /api/payments/coupons/validate`
  - `POST /api/payments/verify`

---

### [S-05] Billing & Invoices Ledger
- **Route:** `/student/invoices`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #103 ([TASK-07.5.3])
- **Key Features & UI Elements:**
  - Transaction history table: Date, Order ID, Course Name, Amount Paid, Payment Method, Status
  - One-click "Download PDF Invoice" button for each completed transaction
- **Consumed APIs:**
  - `GET /api/payments/orders/:orderId/invoice`
  - `GET /api/auth/me`

---

### [S-06] Synchronized Dual-Pane Bilingual E-Book Reader
- **Route:** `/student/books/:bookId`
- **Layout:** `ReaderLayout` (Distraction-free full-screen header, font controls, theme toggle)
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #20 ([TASK-01.4.3]), #26 ([TASK-02.2.2]), #31 ([TASK-02.3.3]), #34 ([TASK-02.4.2])
- **Key Features & UI Elements:**
  - Desktop: Side-by-side dual panes (English on left, Telugu on right) with synchronized scroll-lock
  - Mobile: Floating quick-toggle button (`EN` <-> `TE`) or stacked bilingual view
  - Reading Theme controls: Font size slider (14px - 26px), Light / Dark / Sepia background modes
  - Table of Contents sidebar for rapid chapter jumping
  - Reading progress autosave on scroll pause (`PUT /api/books/:bookId/progress`)
  - Full-text In-Reader Search Drawer (Issue #34): Search across both languages with highlighted matches and 1-click scroll-to-block
  - Text-Selection Annotation Popover (Issue #31): Highlight in 4 colors, attach personal notes, bookmark page
  - Floating Student Watermark Overlay (Issue #20): Dynamic randomized opacity overlay displaying student email and timestamp
  - DRM Anti-Copy Safeguards (Issue #19): Right-click disabled, copy intercepted, print blocked
- **Consumed APIs:**
  - `GET /api/books/:bookId/reader`
  - `GET /api/books/:bookId/progress`
  - `PUT /api/books/:bookId/progress`
  - `GET /api/books/:bookId/search`
  - `GET /api/annotations/book/:bookId`
  - `POST /api/annotations`
  - `PATCH /api/annotations/:id`
  - `DELETE /api/annotations/:id`

---

### [S-07] Cloudflare R2 Video Lecture Player
- **Route:** `/student/courses/:courseId/video/:videoId`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #92 ([TASK-07.2.2])
- **Key Features & UI Elements:**
  - HTML5 Custom Video Player streaming high-bitrate video via time-limited Cloudflare R2 presigned URLs
  - Playback speed controls: 0.75x, 1x, 1.25x, 1.5x, 2x
  - Custom progress seek bar, volume slider, picture-in-picture, and full-screen toggle
  - Auto-progress saving and auto-resume from last watched timestamp
  - Course Playlist Sidebar showing remaining lectures in the module
- **Consumed APIs:**
  - `GET /api/videos/signed-url`
  - `GET /api/admin/courses/:id`

---

### [S-08] Mock Tests & Test Series Catalog
- **Route:** `/student/tests`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #41 ([TASK-03.2.3])
- **Key Features & UI Elements:**
  - Test series grid: Subject Mock Tests, Full-length APPSC Prelims Mocks, Sectional Quizzes
  - Badges indicating Duration (mins), Question Count, Total Marks, Negative Marking coefficient (-0.33)
  - Status indicator: Not Attempted, In Progress, Completed
  - "Take Test" button triggering test instruction modal before launch
- **Consumed APIs:**
  - `GET /api/tests`
  - `GET /api/subjects`

---

### [S-09] Distraction-Free Online Exam Player
- **Route:** `/student/exams/:attemptId`
- **Layout:** `ExamPlayerLayout` (Full-screen, locked navigation, no distractions)
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #19 ([TASK-01.4.2]), #20 ([TASK-01.4.3]), #43 ([TASK-03.3.2])
- **Key Features & UI Elements:**
  - Top Bar: Test Title, Question Section tabs, Countdown Timer (auto-submits at 00:00)
  - Main Question Pane:
    - 1-Click Bilingual Switcher (`EN` <-> `TE`) per question
    - Radio buttons for 4 answer choices
    - Bottom Actions: "Previous", "Clear Response", "Mark for Review & Next", "Save & Next"
  - Palette Sidebar:
    - Numbered question grid with status color badges: Not Visited (Gray), Not Answered (Red), Answered (Green), Marked for Review (Purple)
    - Filter questions by section or status
  - Periodic autosave of responses (`PATCH /api/exams/attempts/:attemptId/autosave`)
  - Emergency offline local state backup in `localStorage`
  - Anti-cheating & DRM safeguards: Fullscreen enforcement, disabled context menu and keyboard shortcuts
  - Confirmation modal on manual "Submit Test"
- **Consumed APIs:**
  - `POST /api/exams/:testId/start`
  - `PATCH /api/exams/attempts/:attemptId/autosave`
  - `POST /api/exams/attempts/:attemptId/submit`

---

### [S-10] Post-Submission Scorecard & Hourly Leaderboard
- **Route:** `/student/exams/:attemptId/scorecard`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #48 ([TASK-03.4.3])
- **Key Features & UI Elements:**
  - Scorecard Header: Total Marks Obtained / Maximum Marks, Percentile, Rank, Time Taken
  - Metrics Cards: Correct Answers, Incorrect Answers (-negative marks deducted), Unattempted Questions
  - Hourly Leaderboard Table: Top peer rankings, scores, percentiles, and current student's standing
  - CTAs: "Review Solutions", "Detailed Analytics", "Back to Tests"
- **Consumed APIs:**
  - `GET /api/exams/attempts/:attemptId/analytics`
  - `GET /api/tests/:id`

---

### [S-11] Question-by-Question Solution Review
- **Route:** `/student/exams/:attemptId/review`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #52 ([TASK-03.5.4])
- **Key Features & UI Elements:**
  - Filter tabs: All Questions, Incorrect, Unattempted, Correct
  - Question Card rendering:
    - English and Telugu question text toggle
    - Student's selected option highlighted (Red if wrong, Green if right)
    - Correct option clearly indicated
    - Marks earned / deducted
    - Time spent on question
    - Rich bilingual explanation box (`explanationEn` & `explanationTe`)
    - Topic & Subtopic tags
- **Consumed APIs:**
  - `GET /api/exams/attempts/:attemptId/review`

---

### [S-12] Student Analytics & Weak Topic Diagnosis
- **Route:** `/student/analytics`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #51 ([TASK-03.5.3])
- **Key Features & UI Elements:**
  - Overall Accuracy Ring chart
  - Time Analysis: Average time spent on correct vs incorrect vs skipped questions
  - Radar chart / Bar graph of accuracy by syllabus topic (Polity, Economy, AP History, Geography)
  - "Weak Topic Diagnosis" Alert Card:
    - Highlights topics with < 50% accuracy
    - Provides specific revision recommendations and links directly to relevant e-book chapters
- **Consumed APIs:**
  - `GET /api/exams/attempts/:attemptId/analytics`

---

### [S-13] Daily Current Affairs Feed & Article Reader
- **Route:** `/student/current-affairs` & `/student/current-affairs/:id`
- **Layout:** `StudentLayout`
- **Primary Persona:** `STUDENT`
- **Issue Reference:** `web-issues.json` #82 ([TASK-06.2.2]), #84 ([TASK-06.3.2])
- **Key Features & UI Elements:**
  - Feed View:
    - Category tabs: State AP, National, Economy, Polity
    - Date range filter & headline search
    - 1-Click bookmark button on each article card
  - Reader View:
    - Clean typography reading format with category badge and publication date
    - 1-Click bookmark toggle
    - **Related Syllabus Concepts Card Component (Issue #82)**:
      - Renders cards displaying related textbook chapters generated by vector semantic linking
      - 1-Click link jumping straight into the Bilingual E-Book Reader at that exact topic
- **Consumed APIs:**
  - `GET /api/current-affairs`
  - `GET /api/current-affairs/:id`
  - `POST /api/current-affairs/bookmarks/:currentAffairsId`
  - `GET /api/current-affairs/bookmarks/:currentAffairsId`

---

## 👨‍🏫 Area 3: Mentor Portal Pages

### [M-01] Mentor Dashboard & Query Hub
- **Route:** `/mentor/dashboard`
- **Layout:** `MentorLayout`
- **Primary Persona:** `MENTOR`
- **Issue Reference:** SOW Section 3
- **Key Features & UI Elements:**
  - Stats overview: Total Assigned Students, Active Doubt Threads, Resolved Doubts
  - Pending Doubts queue sorted by recency
  - Quick action to open doubt chat room
- **Consumed APIs:**
  - `GET /api/chat/threads`
  - `GET /api/chat/unread-count`
  - `GET /api/auth/me`

---

### [M-02] 1-on-1 Real-Time Doubt Resolution Chat
- **Route:** `/mentor/chat` & `/mentor/chat/:threadId` (and `/student/mentors/chat/:threadId`)
- **Layout:** `ChatLayout` (Split-pane thread list and active chat window)
- **Primary Persona:** `MENTOR` and `STUDENT`
- **Issue Reference:** `web-issues.json` #58 ([TASK-04.2.3]), #61 ([TASK-04.3.2]), #65 ([TASK-04.4.3])
- **Key Features & UI Elements:**
  - Conversation Thread List with avatar, student name, last message snippet, timestamp, and unread counter
  - Message Feed with sent/received speech bubbles, delivery checkmarks (`✓`), and read receipts (`✓✓`)
  - Real-time typing indicators
  - Multimedia Upload & Attachment Handler (Issue #61):
    - Photo upload (PNG/JPG <= 5MB)
    - Document attachment (PDF <= 10MB)
    - Voice Note audio recorder & inline waveform audio player
    - Lightbox image viewer for zooming into handwritten problem solutions
  - In-Chat Message Reporting Modal (Issue #65):
    - Allows student or mentor to flag offensive messages to admin moderation
- **Consumed APIs & Sockets:**
  - Sockets: `join_thread`, `leave_thread`, `send_message`, `receive_message`, `mark_read`, `typing_start`, `typing_stop`
  - `GET /api/chat/threads`
  - `GET /api/chat/threads/:threadId/messages`
  - `POST /api/chat/reports`
  - `POST /api/videos/upload` / R2 presigned uploads

---

### [M-03] Mentor Video Lecture & Resource Uploader
- **Route:** `/mentor/content`
- **Layout:** `MentorLayout`
- **Primary Persona:** `MENTOR`
- **Issue Reference:** `web-issues.json` #92 ([TASK-07.2.2])
- **Key Features & UI Elements:**
  - Video lecture upload card with drag-and-drop file uploader (supports up to 500MB)
  - Upload progress bar with real-time percentage
  - Metadata inputs: Title, Description, Subject tag, Topic tag
  - List of previously uploaded videos with processing status
- **Consumed APIs:**
  - `POST /api/videos/upload`
  - `GET /api/subjects`
  - `GET /api/topics`

---

## 🛡️ Area 4: Admin Governance Portal Pages

### [A-01] Admin Platform Analytics Dashboard
- **Route:** `/admin/dashboard`
- **Layout:** `AdminLayout` (Enterprise sidebar with collapsible modules, system status indicator)
- **Primary Persona:** `ADMIN`, `SUPER_ADMIN`
- **Issue Reference:** SOW Section 4
- **Key Features & UI Elements:**
  - Metrics Cards: Total Registered Students, Active Mentors, Published Courses, Daily Test Attempts, Monthly Gross Revenue
  - System Health Card: MongoDB status, R2 Storage status, Redis queue health
  - Recent User Signups & Pending Mentor Applications
  - Quick action shortcuts (Create Test, Publish Current Affairs, New Course)
- **Consumed APIs:**
  - `GET /health`
  - `GET /api/admin/users?limit=5`
  - `GET /api/admin/mentors?status=PENDING`
  - `GET /api/admin/courses`

---

### [A-02] Student & Mentor User Directory & Inspector
- **Route:** `/admin/users`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #106 ([TASK-08.1.2])
- **Key Features & UI Elements:**
  - Data table with search bar and role filters (`STUDENT`, `MENTOR`, `ADMIN`) and status filters (`ACTIVE`, `SUSPENDED`)
  - User detail inspector drawer:
    - Profile metadata (email, registration date, active sessions count)
    - Enrolled courses list and test attempts history
  - One-click account suspension toggle (`PATCH /api/admin/users/:id/status`)
  - Emergency "Revoke All Active Sessions" button (`POST /api/admin/users/:id/revoke-sessions`)
- **Consumed APIs:**
  - `GET /api/admin/users`
  - `GET /api/admin/users/:id`
  - `PATCH /api/admin/users/:id/status`
  - `POST /api/admin/users/:id/revoke-sessions`

---

### [A-03] Mentor Approval & Review Portal
- **Route:** `/admin/mentors`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #55 ([TASK-04.1.3])
- **Key Features & UI Elements:**
  - Filterable list of mentor applications: Pending Review, Approved, Rejected
  - Application Inspector: Academic qualifications, Subject expertise tags, Bio, LinkedIn profile
  - One-click "Approve Mentor" and "Reject Application" buttons with optional rejection notes
- **Consumed APIs:**
  - `GET /api/admin/mentors`
  - `PATCH /api/admin/mentors/:id/status`

---

### [A-04] Book Manager & Translation Review CMS
- **Route:** `/admin/books`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #24 ([TASK-02.1.4]), #77 ([TASK-05.4.2])
- **Key Features & UI Elements:**
  - Book catalog with upload modal: Title, Author, Subject, PDF/EPUB uploader to presigned R2 URL
  - Upload & Digitization progress tracker (reading pages, chunking)
  - Side-by-Side Translation Review Drawer:
    - Displays extracted English blocks on the left and Google-translated Telugu text on the right
    - Inline editable Telugu text fields with "Approve Chunk" toggle
  - "Publish Book" and "Trigger AI Re-Indexing" buttons
- **Consumed APIs:**
  - `GET /api/books`
  - `POST /api/books`
  - `POST /api/books/upload-url`
  - `POST /api/books/confirm-upload`
  - `GET /api/books/upload-jobs/:jobId`
  - `POST /api/books/:bookId/reindex`

---

### [A-05] Question Bank & Bulk Import CMS
- **Route:** `/admin/questions`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #38 ([TASK-03.1.4])
- **Key Features & UI Elements:**
  - Subject -> Topic -> Subtopic taxonomy management sidebar (create, edit, delete categories)
  - Filterable questions data table by Subject, Topic, Difficulty
  - Question Editor: Bilingual inputs for Question Text (`EN` / `TE`), 4 Options (`EN` / `TE`), Correct Option selector, and Bilingual Explanations
  - Bulk Importer Modal: Upload CSV or JSON files with format validation and live preview of parsed rows
- **Consumed APIs:**
  - `GET/POST/PATCH/DELETE /api/subjects`
  - `GET/POST/PATCH/DELETE /api/topics`
  - `GET/POST/PATCH/DELETE /api/subtopics`
  - `GET/POST/PATCH/DELETE /api/questions`
  - `POST /api/questions/import/json`
  - `POST /api/questions/import/csv`

---

### [A-06] Test Builder & Rules Configuration Wizard
- **Route:** `/admin/tests/builder`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #41 ([TASK-03.2.3])
- **Key Features & UI Elements:**
  - Step 1: Basic Configuration (Title, Description, Duration in minutes, Total Marks)
  - Step 2: Rules Engine (Negative marking coefficient, randomize questions toggle, randomize options toggle)
  - Step 3: Question Selector (Interactive question picker with subject/topic filters and section bundler)
  - Step 4: Scheduling (On-demand availability vs Scheduled window start/end time)
- **Consumed APIs:**
  - `POST /api/tests`
  - `GET /api/questions`
  - `GET /api/subjects`
  - `GET /api/topics`

---

### [A-07] Course Builder & Curriculum Bundler
- **Route:** `/admin/courses/builder`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #89 ([TASK-07.1.3])
- **Key Features & UI Elements:**
  - Course metadata editor: Title, Description, Thumbnail uploader, Validity in Days (e.g., 180, 365), Base Price, Discounted Price
  - Curriculum Bundler interface:
    - Add Video Lectures from R2 storage library
    - Add Bilingual E-Books from digital book bank
    - Add Mock Tests from test series bank
    - Drag-and-drop order rearrangement
  - Course Status toggle: Draft, Published, Archived
- **Consumed APIs:**
  - `POST /api/admin/courses`
  - `PUT /api/admin/courses/:id/curriculum`
  - `PATCH /api/admin/courses/:id/status`
  - `GET /api/books`
  - `GET /api/tests`

---

### [A-08] Daily Current Affairs Editor & Scheduler
- **Route:** `/admin/current-affairs`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #80 ([TASK-06.1.3])
- **Key Features & UI Elements:**
  - Rich Text Article Editor (Headings, bold, lists, quotes, inline images)
  - Metadata selector: Category (`STATE_AP`, `NATIONAL`, `ECONOMY`, `POLITY`), Tags, Thumbnail upload
  - Publishing Scheduler (Schedule for specific date/time or Publish Now)
  - Status management table (Draft, Published, Scheduled, Archived)
- **Consumed APIs:**
  - `POST /api/admin/current-affairs`
  - `GET /api/admin/current-affairs`
  - `PUT /api/admin/current-affairs/:id`
  - `PATCH /api/admin/current-affairs/:id/status`

---

### [A-09] AI Settings & Knowledge Base Indexing
- **Route:** `/admin/ai-settings`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #77 ([TASK-05.4.2])
- **Key Features & UI Elements:**
  - OpenRouter Model Selector (e.g., `meta-llama/llama-3.2-3b-instruct:free`)
  - AI Assistant prompt instructions editor
  - External web search toggle (enable/disable fallback search)
  - Knowledge Base Index Status table:
    - Lists all indexed books with chunk counts, vectorization status, last updated timestamp
    - 1-Click "Re-index" button per book triggering Atlas Vector Search embeddings regeneration
- **Consumed APIs:**
  - `GET /admin/ai-settings`
  - `PUT /admin/ai-settings`
  - `POST /api/books/:bookId/reindex`
  - `POST /api/ai/vector-search`

---

### [A-10] Chat Moderation & Audit Archive Explorer
- **Route:** `/admin/chat/moderation` & `/admin/chat/audit`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #65 ([TASK-04.4.3])
- **Key Features & UI Elements:**
  - Moderation Queue: Flagged student/mentor messages, report reason, reporter info, and resolution actions (Dismiss, Warn User, Suspend User)
  - Chat Audit Archive: Searchable directory of all student-mentor conversation threads
  - Transcript Drawer: View complete verbatim transcript of any conversation thread
  - Global Message Keyword Search: Search across all chat communications by keyword or date range
- **Consumed APIs:**
  - `GET /api/admin/chat/reports`
  - `PATCH /api/admin/chat/reports/:id`
  - `GET /api/admin/chat/threads`
  - `GET /api/admin/chat/threads/:threadId/transcript`
  - `GET /api/admin/chat/messages/search`

---

### [A-11] Financial Manager, Refunds & Audit Logs
- **Route:** `/admin/financials` & `/admin/audit-logs`
- **Layout:** `AdminLayout`
- **Primary Persona:** `ADMIN`
- **Issue Reference:** `web-issues.json` #103 ([TASK-07.5.3]), #109 ([TASK-08.2.3])
- **Key Features & UI Elements:**
  - Orders & Revenue ledger with filter by status and date range
  - Razorpay Refund Action Modal: Issue full or partial refunds directly back to student's payment method
  - **Audit Logs Viewer (Issue #109)**:
    - Filterable immutable log table: Timestamp, Actor Name & Email, Action (`UPDATE_USER`, `DELETE_BOOK`, `CREATE_REFUND`), Resource Type, IP Address
    - Delta Inspector Modal: Side-by-side JSON diff comparing pre-change state and post-change state
- **Consumed APIs:**
  - `POST /api/payments/:paymentId/refunds`
  - `GET /api/admin/chat/audit-logs`
  - `GET /admin/settings`
  - `PATCH /admin/settings`

---

## 🌐 Area 5: Global Interactive Overlays

### [G-01] Global AI Study Assistant Drawer
- **Activation:** Persistent floating icon on all student pages, or via in-reader keyboard shortcut (`Cmd+K` / `Ctrl+K`)
- **Issue Reference:** `web-issues.json` #71 ([TASK-05.2.3])
- **Key Features & UI Elements:**
  - Floating sliding drawer with streaming chat interface
  - Markdown formatting and LaTeX KaTeX mathematical formula rendering
  - Inline Citation Pills linking directly to book and page references (clicking jumps to reader)
  - Quick query chips ("Summarize this topic", "Practice MCQs on this", "Explain in Telugu")
- **Consumed APIs:**
  - `POST /api/ai/vector-search`

---

### [G-02] Dynamic Student Watermark & Single-Session Eviction Listener
- **Activation:** Mounted at the application root (`App.jsx`)
- **Issue Reference:** `web-issues.json` #16 ([TASK-01.3.3]), #20 ([TASK-01.4.3])
- **Key Features & UI Elements:**
  - Socket.IO listener for event `session_revoked`:
    - Instantly renders high-priority blocking modal: *"Your session has been terminated due to login from another device."*
    - Automatically clears local JWT tokens and redirects browser to `/login`
  - Floating Dynamic Watermark Canvas:
    - Injects subtle semi-transparent watermark containing student's registered email, user ID, and current timestamp across e-book reading and exam player viewports
