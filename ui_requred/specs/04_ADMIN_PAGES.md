# Specification 04: Admin Governance, Content CMS & Financial Management

This document provides exhaustive specifications for all 11 Admin Governance Portal pages, covering platform administration, content digitization pipelines, examination authoring, AI index governance, moderation, and immutable audit logs.

---

## 📌 Issue References
- **Issue #24 [TASK-02.1.4]**: Admin Book Manager & Side-by-Side Translation Review in React.js
- **Issue #38 [TASK-03.1.4]**: Admin Question Bank UI in React.js with Taxonomy & Bulk Import
- **Issue #41 [TASK-03.2.3]**: Admin Test Builder UI with Question Selector in React.js
- **Issue #55 [TASK-04.1.3]**: Admin Mentor Approval Portal
- **Issue #65 [TASK-04.4.3]**: Admin Chat Moderation UI & Searchable Audit Archive
- **Issue #77 [TASK-05.4.2]**: Admin AI Settings & Index Status Dashboard in React.js
- **Issue #80 [TASK-06.1.3]**: Admin Current Affairs Editor & Scheduler in React.js
- **Issue #89 [TASK-07.1.3]**: Admin Course Builder UI in React.js + Tailwind CSS
- **Issue #103 [TASK-07.5.3]**: Admin Refund Management & Invoicing UI
- **Issue #106 [TASK-08.1.2]**: Admin User Directory and User Inspector UI in React.js
- **Issue #109 [TASK-08.2.3]**: Admin Audit Logs Viewer & Delta Inspector in React.js

---

## 1. User Directory & User Inspector (`AdminUsersPage`)
- **Route:** `/admin/users`
- **Issue:** #106 ([TASK-08.1.2])

### Data Table Controls
- Global Search bar (matches name, email, phone number).
- Role Filters: `STUDENT`, `MENTOR`, `ADMIN`.
- Status Filters: `ACTIVE`, `SUSPENDED`, `PENDING`.
- Columns: User Name, Email, Role Badge, Status Badge, Registration Date, Active Sessions, Actions.

### User Inspector Drawer (`UserInspectorDrawer`)
Clicking any user row slides out a detailed inspector drawer:
1. **Profile Summary**: Avatar, name, email, contact, registration date.
2. **Session Security Management**:
   - Displays number of active browser/device sessions.
   - **Emergency Button**: *"Revoke All Active Sessions"* (`POST /api/admin/users/:id/revoke-sessions`). Triggers immediate Socket.IO eviction of all connected devices.
3. **Status Control**:
   - Toggle button: *"Suspend User Account"* / *"Activate User Account"* (`PATCH /api/admin/users/:id/status`).
4. **Learning History Tabs**:
   - Enrolled Courses (with start/expiration dates).
   - Test Attempts History (with scores, percentiles, and completion timestamps).

---

## 2. Book Manager & Translation Review CMS (`AdminBookManagerPage`)
- **Route:** `/admin/books`
- **Issue:** #24 ([TASK-02.1.4]), #77 ([TASK-05.4.2])

### Digitization Workflow
1. **Book Creation & Direct R2 Upload**:
   - Admin provides Title, Author, Subject, Description.
   - PDF/EPUB file uploaded directly to Cloudflare R2 using presigned URL (`POST /api/books/upload-url`).
   - Progress bar tracks upload and backend digitization chunking job (`GET /api/books/upload-jobs/:jobId`).
2. **Side-by-Side Translation Review Interface**:
   - Dual-column translation inspection drawer:
     - Left Column: Extracted English text chunk with page number and section title.
     - Right Column: Google Cloud Translated Telugu text in an editable text area.
   - Status toggle on each block: `UNREVIEWED` -> `APPROVED`.
   - Batch Actions: *"Approve All Chunks"*, *"Save Draft"*, *"Publish Book"*.
3. **AI Re-Indexing Trigger**:
   - 1-Click *"Re-index for AI Assistant"* button (`POST /api/books/:bookId/reindex`) to update MongoDB Atlas vector embeddings.

---

## 3. Question Bank & Taxonomy CMS (`AdminQuestionBankPage`)
- **Route:** `/admin/questions`
- **Issue:** #38 ([TASK-03.1.4])

### Taxonomy Management Sidebar
- Interactive hierarchical tree: `Subject` -> `Topic` -> `Subtopic`.
- Inline actions to add, rename, or delete nodes across all levels.

### Bilingual Question Editor Modal
- Question Text: English input & Telugu input.
- Options: 4 rows with English text, Telugu text, and a radio button to designate `correctOption` (1-4).
- Explanations: Bilingual detailed rationale (`explanationEn` & `explanationTe`).
- Difficulty selector: `EASY`, `MEDIUM`, `HARD`.

### Bulk Question Importer Modal
- Drag-and-drop file upload supporting `.csv` and `.json`.
- Live JSON schema and CSV header validator.
- Preview table showing parsed rows with syntax error highlighting before committing to database.

---

## 4. Test Builder & Exam Rules Wizard (`AdminTestBuilderPage`)
- **Route:** `/admin/tests/builder`
- **Issue:** #41 ([TASK-03.2.3])

### 4-Step Interactive Wizard
1. **Step 1: Exam Metadata**:
   - Title, Description, Subject category, Target APPSC Exam (Group 1, 2, 3).
2. **Step 2: Scoring & Rules Engine**:
   - Duration in minutes (e.g. 150 mins).
   - Total Marks (e.g. 150).
   - Marks per question (+1.0).
   - Negative Marking Coefficient (e.g. `-0.33` or `-0.25`).
   - Toggle: *Randomize Question Order*.
   - Toggle: *Randomize Option Order*.
3. **Step 3: Section & Question Selector**:
   - Add sections (e.g. *General Studies, Mental Ability, AP History*).
   - Filterable question picker from Question Bank by Subject/Topic.
   - Selected questions tally and total section marks counter.
4. **Step 4: Scheduling & Publishing**:
   - Availability mode: *Always On-Demand* vs *Scheduled Window* (Start Date/Time to End Date/Time).
   - Save as Draft or Publish immediately.

---

## 5. Course Builder & Curriculum Bundler (`AdminCourseBuilderPage`)
- **Route:** `/admin/courses/builder`
- **Issue:** #89 ([TASK-07.1.3])

### Course Authoring Modules
- **Metadata Editor**: Title, Subtitle, Description, Thumbnail uploader, Validity in Days (e.g. 180, 365 days), Base Price (INR), Discounted Price (INR).
- **Curriculum Bundler**:
  - Add Video Lectures from R2 storage library.
  - Add Bilingual E-Books from digital book bank.
  - Add Mock Tests from test series bank.
  - Drag-and-drop order rearrangement (`PUT /api/admin/courses/:id/curriculum`).
- **Publishing Controls**: Draft, Published, Archived (`PATCH /api/admin/courses/:id/status`).

---

## 6. Daily Current Affairs Editor & Scheduler (`AdminCurrentAffairsEditorPage`)
- **Route:** `/admin/current-affairs`
- **Issue:** #80 ([TASK-06.1.3])
- **Components:**
  - Rich Text Article Editor supporting headings, quotes, bullet points, and inline figures.
  - Category selector: `STATE_AP`, `NATIONAL`, `ECONOMY`, `POLITY`.
  - Tag manager (e.g. *Polavaram, Budget 2026, High Court Ruling*).
  - Thumbnail and accompanying PDF uploader.
  - Publishing Scheduler: Select publication date and time or Publish Now.
  - Background vector linking status badge (shows if RAG embeddings are generated).

---

## 7. AI Settings & Index Status Dashboard (`AdminAiSettingsPage`)
- **Route:** `/admin/ai-settings`
- **Issue:** #77 ([TASK-05.4.2])
- **Controls & Metrics:**
  - OpenRouter Model dropdown (e.g. `meta-llama/llama-3.2-3b-instruct:free`).
  - System Instructions / Prompt template editor.
  - Toggle: *External Web Search Fallback*.
  - Temperature slider (0.0 to 1.0) and Max Tokens input.
  - **Knowledge Base Index Status Table**:
    - Columns: Book Title, Total Extracted Chunks, Vector Index Status (`INDEXED`, `PENDING`), Last Updated.
    - Actions: 1-Click *"Re-index"* button per book.

---

## 8. Chat Moderation & Audit Archive (`AdminChatModerationPage`, `AdminChatAuditPage`)
- **Routes:** `/admin/chat/moderation` & `/admin/chat/audit`
- **Issue:** #65 ([TASK-04.4.3])

### Moderation Queue
- Filter by status: `PENDING`, `RESOLVED`.
- Moderation card showing: Reporter, Reported User, Message snippet, Timestamp, Selected reason.
- Actions:
  - *"Dismiss Report"*
  - *"Issue Official Warning to User"*
  - *"Suspend User Account Immediately"*

### Chat Audit Archive
- Searchable directory of all student-mentor conversation threads across the platform.
- Full transcript viewer displaying complete un-redacted chat message history.
- Global message search bar to query keywords across historical messages.

---

## 9. Financial Management, Refunds & Invoicing (`AdminFinancialsPage`)
- **Route:** `/admin/financials`
- **Issue:** #103 ([TASK-07.5.3])
- **Features:**
  - Real-time orders ledger: Order ID, Student Email, Course Title, Amount, Payment Gateway ID, Status (`PAID`, `REFUNDED`).
  - One-click PDF invoice viewer.
  - **Razorpay Refund Action Modal**:
    - Select full or partial refund amount.
    - Input administrative reason (e.g. *Accidental duplicate purchase*).
    - Submits to `POST /api/payments/:paymentId/refunds`.
    - Automatically updates order status to `REFUNDED`.

---

## 10. Audit Logs Viewer & Delta Inspector (`AdminAuditLogsPage`)
- **Route:** `/admin/audit-logs`
- **Issue:** #109 ([TASK-08.2.3])

### Immutable Audit Log Explorer
- Data table displaying administrative events recorded by audit middleware:
  - Timestamp
  - Actor Email & Role
  - Action (e.g. `UPDATE_USER`, `DELETE_BOOK`, `CREATE_REFUND`, `UPDATE_AI_SETTINGS`)
  - Resource Type (`USER`, `BOOK`, `TEST`, `PAYMENT`, `SETTING`)
  - Resource ID
  - IP Address
- Filter by Actor, Resource Type, and Date Range.

### Delta Inspector Modal
Clicking on any audit log entry opens a side-by-side JSON diff inspector:
- **Left Column ("Before Changes")**: Snapshot of resource fields before mutation.
- **Right Column ("After Changes")**: Snapshot of resource fields after mutation with changed values highlighted in green/red.
