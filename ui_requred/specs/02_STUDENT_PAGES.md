# Specification 02: Student Experience & Learning Portal Pages

This document details the visual layouts, interactive behaviors, algorithms, and backend API integrations for all 13 Student Portal pages and the Global AI Study Assistant.

---

## 📌 Issue References
- **Issue #26 [TASK-02.2.2]**: Web Dual-Pane Bilingual Reader with Synchronized Scrolling
- **Issue #31 [TASK-02.3.3]**: Text-Selection Annotation Popover and Highlighter
- **Issue #34 [TASK-02.4.2]**: In-Reader Full-Text Search Drawer
- **Issue #43 [TASK-03.3.2]**: Web Exam Player with Palette Sidebar and Timer
- **Issue #48 [TASK-03.4.3]**: Test Scorecard & Hourly Leaderboard UI
- **Issue #51 [TASK-03.5.3]**: Student Analytics Dashboard & Weak Topic Diagnosis
- **Issue #52 [TASK-03.5.4]**: Question-by-Question Solution Review UI with Bilingual Explanations
- **Issue #71 [TASK-05.2.3]**: AI Chat Drawer with Markdown, KaTeX & Citation Pills
- **Issue #82 [TASK-06.2.2]**: Related Syllabus Concepts Card Component
- **Issue #84 [TASK-06.3.2]**: Current Affairs Feed, Filters, and Reader View
- **Issue #90 [TASK-07.1.4]**: Student Course Catalog and Course Details Screens
- **Issue #92 [TASK-07.2.2]**: HTML5 Video Player with Speed Controls & Progress Autosave
- **Issue #96 [TASK-07.3.3]**: Razorpay Standard Checkout Integration
- **Issue #100 [TASK-07.4.3]**: Student My Enrolled Courses Dashboard with Validity Countdown
- **Issue #103 [TASK-07.5.3]**: Coupon Input at Checkout & Invoice Downloads

---

## 1. Student Dashboard & Enrolled Courses (`StudentDashboardPage`)
- **Route:** `/student/dashboard`
- **Issue:** #100 ([TASK-07.4.3])
- **Layout & Key Sections:**
  1. **Validity Countdown Badge**:
     - Calculates days between `now` and `entitlement.expiresAt`.
     - Badges:
       - Green: `> 14 Days Remaining`
       - Amber: `7 - 14 Days Remaining`
       - Red Alert: `< 7 Days Remaining (Expires Soon)`
       - Expired: `Expired (Read-Only Mode)`
  2. **Active Course Cards**:
     - Thumbnail, Course Title, Progress Bar, Direct Jump Buttons (Watch Video, Open Book, Take Test).
  3. **Resume Learning Widget**:
     - Displays last accessed book chapter (`PUT /api/books/:id/progress`) and last test score.

---

## 2. Course Catalog & Details Screen
- **Routes:** `/student/courses` & `/courses/:courseId`
- **Issue:** #90 ([TASK-07.1.4])
- **Components:**
  - `CourseCatalogFilterBar`: Filter by Exam (Group 1, 2, 3), Subject, Pricing.
  - `CurriculumAccordion`:
    - Tab 1: Video Lectures (Cloudflare R2 duration, chapter outline).
    - Tab 2: Bilingual E-Books (List of chapters with page count).
    - Tab 3: Mock Tests (Questions count, marks, negative marking rules).
  - `StickyPricingCard`: Base Price, Discounted Price, Validity Period, and *"Enroll Now"* CTA.

---

## 3. Checkout & Razorpay Payment Integration (`CheckoutPage`)
- **Route:** `/checkout/:courseId`
- **Issues:** #96 ([TASK-07.3.3]), #103 ([TASK-07.5.3])
- **Workflow:**
  1. **Coupon Input Widget**:
     - User inputs coupon code (e.g. `APPSC50`).
     - Triggers `POST /api/payments/coupons/validate` with `{ couponCode, courseId }`.
     - Displays discount amount, subtotal, and final amount.
  2. **Order Creation**:
     - User clicks *"Proceed to Payment"*.
     - Calls `POST /api/payments/create-order` -> receives `{ razorpayOrderId, amount, currency, keyId }`.
  3. **Razorpay Modal Handler**:
     - Loads `https://checkout.razorpay.com/v1/checkout.js`.
     - Opens Razorpay modal with `razorpayOrderId`.
     - On payment completion callback, submits `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }` to `POST /api/payments/verify`.
     - Redirects to `/student/dashboard?payment=success`.

---

## 4. Bilingual Dual-Pane E-Book Reader (`BilingualReaderPage`)
- **Route:** `/student/books/:bookId`
- **Issues:** #26 ([TASK-02.2.2]), #31 ([TASK-02.3.3]), #34 ([TASK-02.4.2]), #20 ([TASK-01.4.3])

### Synchronized Scrolling Algorithm
```javascript
// Synchronized Scroll Controller
const handleScroll = (sourcePane, targetPane) => {
  if (isSyncingScroll.current) return;
  isSyncingScroll.current = true;

  const scrollPercentage = sourcePane.scrollTop / (sourcePane.scrollHeight - sourcePane.clientHeight);
  targetPane.scrollTop = scrollPercentage * (targetPane.scrollHeight - targetPane.clientHeight);

  setTimeout(() => {
    isSyncingScroll.current = false;
  }, 30);
};
```

### Features & Controls
1. **Side-by-Side Dual Pane**:
   - Left Pane: English content blocks.
   - Right Pane: Telugu content blocks.
   - Mobile: Quick toggle button (`EN` <-> `TE`) or stacked view.
2. **Themes**: Light (`#ffffff`), Dark (`#121212`), Sepia (`#fbf0d9`).
3. **Reading Progress Autosave**:
   - On scroll pause (debounced 1.5s), calls `PUT /api/books/:bookId/progress`.
4. **Text Selection Annotation Popover (Issue #31)**:
   - User highlights text in either pane -> floating popover displays:
     - Color swatch: Yellow, Green, Pink, Blue.
     - Note button: Opens note input modal.
     - Bookmark toggle.
   - Persists to `POST /api/annotations`.
5. **In-Reader Search Drawer (Issue #34)**:
   - Full-text search across both languages via `GET /api/books/:bookId/search?query=...`.
   - Results show matching snippet and 1-click smooth scroll to the target block.

---

## 5. Distraction-Free Online Exam Player (`ExamPlayerPage`)
- **Route:** `/student/exams/:attemptId`
- **Issues:** #43 ([TASK-03.3.2]), #19 ([TASK-01.4.2]), #20 ([TASK-01.4.3])

### State Machine & Question Palette
| Status Badge | Color | Criteria |
|---|---|---|
| **Not Visited** | Neutral Gray (`bg-gray-100 text-gray-700`) | Question has never been opened. |
| **Unanswered** | Danger Red (`bg-red-500 text-white`) | Question viewed but no option selected. |
| **Answered** | Success Green (`bg-emerald-500 text-white`) | Option selected and saved. |
| **Marked for Review** | Purple (`bg-purple-500 text-white`) | Student flagged question for second look. |

### Player Controls
- **Bilingual Switcher**: 1-Click toggle (`EN` <-> `TE`) instantly switches question stem and option text without losing selection state.
- **Timer & Auto-Submit**: Countdown from `durationMinutes`. At `00:00`, prompts a warning and triggers automatic submission (`POST /api/exams/attempts/:attemptId/submit`).
- **Autosave Engine**: Every option click triggers a debounced call to `PATCH /api/exams/attempts/:attemptId/autosave`. Also backups state to `localStorage` every 15 seconds.

---

## 6. Scorecard, Leaderboard & Solution Review
- **Routes:** `/student/exams/:attemptId/scorecard` & `/student/exams/:attemptId/review`
- **Issues:** #48 ([TASK-03.4.3]), #52 ([TASK-03.5.4])

### Scorecard Metrics
- Marks Calculation: `(Correct × marksPerQuestion) - (Incorrect × negativeMarkingCoefficient)`.
- Hourly Peer Leaderboard table showing Top 10 rankings and current student's position.

### Solution Review UI
- Filter tabs: All, Incorrect, Unattempted, Correct.
- Renders question stem in English/Telugu.
- Highlights student's chosen option (Red if incorrect, Green if correct).
- Shows correct answer key with comprehensive bilingual explanations (`explanationEn` & `explanationTe`).

---

## 7. Performance Analytics & Weak Topic Diagnosis (`StudentAnalyticsPage`)
- **Route:** `/student/analytics`
- **Issue:** #51 ([TASK-03.5.3])
- **Components:**
  1. **Accuracy Rings**: Overall percentage, correct vs incorrect ratio.
  2. **Time Analysis Graph**: Compares average seconds per question for correct (e.g. 42s) vs incorrect (e.g. 78s) vs skipped (e.g. 15s).
  3. **Topic Mastery Radar Chart**: Visual breakdown across AP History, Polity, Geography, Economy.
  4. **Weak Topic Diagnosis Card**:
     - Highlights topics with `< 50%` accuracy.
     - Custom recommendations linking directly to the respective textbook chapter in the E-Book Reader.

---

## 8. Daily Current Affairs Feed & Semantic Linking
- **Routes:** `/student/current-affairs` & `/student/current-affairs/:id`
- **Issues:** #82 ([TASK-06.2.2]), #84 ([TASK-06.3.2])
- **Components:**
  - `CategoryTabs`: State AP, National, Economy, Polity.
  - `BookmarkToggle`: Calls `POST /api/current-affairs/bookmarks/:id`.
  - **`RelatedSyllabusCard` (Issue #82)**:
    - Renders directly underneath each current affairs article.
    - Displays syllabus topics semantically linked by Atlas Vector Search embeddings.
    - Example: An article on AP irrigation projects attaches cards linking to *"Chapter 4: River Systems & Water Resources of Andhra Pradesh"*.
    - 1-Click button opens the bilingual reader at that chapter.

---

## 9. Global AI Study Assistant Drawer (`AiAssistantDrawer`)
- **Global Component** | Floating widget on all student views
- **Issue:** #71 ([TASK-05.2.3])
- **Interaction & Rendering:**
  1. **Drawer Trigger**: Floating mascot button on bottom right or `Cmd+K`.
  2. **Streaming AI Chat**: Queries backend RAG pipeline; animates streaming text tokens.
  3. **KaTeX Math Engine**: Renders LaTeX formulas (e.g. $\Delta = b^2 - 4ac$, Indian economy formulas) inline.
  4. **Clickable Citation Pills**:
     - When the assistant cites reference literature (e.g. `[AP History, Ch. 2, p. 45]`), it renders as a clickable badge.
     - Clicking the badge navigates the student directly to `/student/books/:bookId?chapter=2&page=45`.
