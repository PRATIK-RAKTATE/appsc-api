# Complete Backend API Inventory & Frontend Consumer Mapping

This document provides an exhaustive, field-by-field reference of all **123 REST API Endpoints** and **13 Socket.IO Real-Time Events** implemented in the backend (`server/src/modules/`), along with their exact request/response data contracts and the UI pages that consume them.

---

## 📑 Module Index
1. [Authentication & Session Governance (`/api/auth`)](#1-authentication--session-governance-apiauth)
2. [Bilingual E-Books & Content Digitization (`/api/books`)](#2-bilingual-e-books--content-digitization-apibooks)
3. [Question Bank & Taxonomy (`/api/subjects`, `/topics`, `/subtopics`, `/questions`)](#3-question-bank--taxonomy)
4. [Platform & AI Settings (`/admin/settings`, `/admin/ai-settings`)](#4-platform--ai-settings)
5. [Exams & Online Assessments (`/api/tests`, `/api/exams`)](#5-exams--online-assessments-apitests-apiexams)
6. [Daily Current Affairs & Semantic Linking (`/api/current-affairs`, `/api/admin/current-affairs`)](#6-daily-current-affairs--semantic-linking)
7. [Cloudflare R2 Video Hosting (`/api/videos`)](#7-cloudflare-r2-video-hosting-apivideos)
8. [Razorpay Payments, Invoicing & Refunds (`/api/payments`, `/api/webhooks`)](#8-razorpay-payments-invoicing--refunds)
9. [Courses & Curriculum Bundles (`/api/admin/courses`)](#9-courses--curriculum-bundles-apiadmincourses)
10. [User Directory & Administration (`/api/admin/users`)](#10-user-directory--administration-apiadminusers)
11. [Study Annotations, Notes & Bookmarks (`/api/annotations`)](#11-study-annotations-notes--bookmarks-apiannotations)
12. [AI Assistant Vector Search (`/api/ai`)](#12-ai-assistant-vector-search-apiai)
13. [1-on-1 Mentor Communication & Moderation (`/api/chat`, `/api/admin/chat`)](#13-1-on-1-mentor-communication--moderation)
14. [Mentor Applications & Discovery (`/api/mentors`, `/api/admin/mentors`)](#14-mentor-applications--discovery)
15. [System Health Check (`/health`)](#15-system-health-check)
16. [Socket.IO Real-Time Gateway & Events](#16-socketio-real-time-gateway--events)

---

## 1. Authentication & Session Governance (`/api/auth`)

| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 1 | `POST` | `/api/auth/send-otp` | Public | `{ email: string, role?: string }` | `{ success: true, message: string, expiresInSeconds: number }` | `LoginPage` |
| 2 | `POST` | `/api/auth/verify-otp` | Public | `{ email: string, otp: string }` | `{ success: true, accessToken: string, refreshToken: string, user: { _id, email, role, fullName } }` | `LoginPage` |
| 3 | `POST` | `/api/auth/refresh-token` | Public | `{ refreshToken: string }` | `{ success: true, accessToken: string, refreshToken: string }` | `Axios Interceptor / AuthStore` |
| 4 | `GET` | `/api/auth/me` | Protected (`STUDENT`, `MENTOR`, `ADMIN`) | Headers: `Authorization: Bearer <token>` | `{ success: true, user: { _id, email, role, fullName, avatarUrl, status } }` | Global Navbar, Route Guards |

---

## 2. Bilingual E-Books & Content Digitization (`/api/books`)

| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 5 | `POST` | `/api/books/book-blocks` | Public/Internal | `{ bookId, chapterId, blockIndex, enText, teText }` | `{ success: true, block: Object }` | Translation Pipeline Worker |
| 6 | `GET` | `/api/books/upload-jobs/:jobId` | Protected (`ADMIN`) | Path: `:jobId` | `{ success: true, job: { _id, status, progress, totalPages, processedPages, error } }` | `AdminBookManagerPage` |
| 7 | `POST` | `/api/books/upload-url` | Protected (`ADMIN`) | `{ fileName: string, contentType: string }` | `{ success: true, uploadUrl: string, key: string, jobId: string }` | `AdminBookManagerPage` |
| 8 | `POST` | `/api/books/:id/upload-url` | Protected (`ADMIN`) | Path: `:id`, Body: `{ fileName, contentType }` | `{ success: true, uploadUrl: string, key: string, jobId: string }` | `AdminBookManagerPage` |
| 9 | `POST` | `/api/books/confirm-upload` | Protected (`ADMIN`) | `{ uploadJobId: string, bookId?: string }` | `{ success: true, book: Object, job: Object }` | `AdminBookManagerPage` |
| 10 | `POST` | `/api/books/:id/confirm-upload` | Protected (`ADMIN`) | Path: `:id`, Body: `{ uploadJobId: string }` | `{ success: true, book: Object, job: Object }` | `AdminBookManagerPage` |
| 11 | `POST` | `/api/books/:id/fail-upload` | Protected (`ADMIN`) | Path: `:id`, Body: `{ uploadJobId: string, reason: string }` | `{ success: true, message: string }` | `AdminBookManagerPage` |
| 12 | `GET` | `/api/books/:id/upload-jobs` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, jobs: Array<UploadJob> }` | `AdminBookManagerPage` |
| 13 | `GET` | `/api/books/:bookId/reader` | Protected (`All Roles`) | Path: `:bookId`, Query: `?chapterId=...` | `{ success: true, book: { _id, title, author }, chapters: Array, blocks: Array<{ blockIndex, enText, teText, pageNumber }> }` | `BilingualReaderPage` |
| 14 | `GET` | `/api/books/:bookId/progress` | Protected (`STUDENT`) | Path: `:bookId` | `{ success: true, progress: { lastChapterId, lastBlockIndex, percentComplete, updatedAt } }` | `BilingualReaderPage` |
| 15 | `PUT` | `/api/books/:bookId/progress` | Protected (`STUDENT`) | Path: `:bookId`, Body: `{ chapterId, blockIndex, percentComplete }` | `{ success: true, progress: Object }` | `BilingualReaderPage` (Autosave) |
| 16 | `GET` | `/api/books/:bookId/search` | Protected (`STUDENT`) | Path: `:bookId`, Query: `?query=term&language=en\|te` | `{ success: true, matches: Array<{ chapterId, chapterTitle, blockIndex, snippetEn, snippetTe, pageNumber }> }` | `ReaderSearchDrawer` |
| 17 | `POST` | `/api/books/:bookId/reindex` | Protected (`ADMIN`) | Path: `:bookId` | `{ success: true, message: "Reindexing job scheduled", chunksCount: number }` | `AdminAiSettingsPage`, `AdminBookManagerPage` |
| 18 | `POST` | `/api/books` | Protected (`ADMIN`) | `{ title, author, subjectId, description, coverImageUrl }` | `{ success: true, data: Book }` | `AdminBookManagerPage` |
| 19 | `GET` | `/api/books` | Protected (`All Roles`) | Query: `?page=1&limit=20&search=...&subjectId=...` | `{ success: true, data: Array<Book>, pagination: { total, page, limit } }` | `StudentBooksCatalogPage`, `AdminBookManagerPage` |
| 20 | `GET` | `/api/books/:id` | Protected (`All Roles`) | Path: `:id` | `{ success: true, data: Book }` | `BookDetailsModal`, `BilingualReaderPage` |
| 21 | `PUT` | `/api/books/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `{ title, author, subjectId, description }` | `{ success: true, data: Book }` | `AdminBookManagerPage` |
| 22 | `PATCH` | `/api/books/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `Partial<Book>` | `{ success: true, data: Book }` | `AdminBookManagerPage` |
| 23 | `DELETE` | `/api/books/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, message: "Book deleted" }` | `AdminBookManagerPage` |

---

## 3. Question Bank & Taxonomy

### A. Subjects (`/api/subjects`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 24 | `POST` | `/api/subjects` | Protected (`ADMIN`) | `{ name: string, code?: string, description?: string }` | `{ success: true, data: Subject }` | `AdminQuestionBankPage` |
| 25 | `GET` | `/api/subjects` | Protected (`All Roles`) | Query: `?search=...` | `{ success: true, data: Array<Subject> }` | `AdminQuestionBankPage`, `AdminTestBuilderPage`, Catalog filters |
| 26 | `GET` | `/api/subjects/:id` | Protected (`All Roles`) | Path: `:id` | `{ success: true, data: Subject }` | `AdminQuestionBankPage` |
| 27 | `PATCH` | `/api/subjects/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `{ name, code, description }` | `{ success: true, data: Subject }` | `AdminQuestionBankPage` |
| 28 | `DELETE` | `/api/subjects/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, message: "Subject deleted" }` | `AdminQuestionBankPage` |

### B. Topics (`/api/topics`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 29 | `POST` | `/api/topics` | Protected (`ADMIN`) | `{ topicName: string, subjectID: string }` | `{ success: true, data: Topic }` | `AdminQuestionBankPage` |
| 30 | `GET` | `/api/topics` | Protected (`All Roles`) | Query: `?subjectId=...` | `{ success: true, data: Array<Topic> }` | `AdminQuestionBankPage`, `AdminTestBuilderPage` |
| 31 | `GET` | `/api/topics/:id` | Protected (`All Roles`) | Path: `:id` | `{ success: true, data: Topic }` | `AdminQuestionBankPage` |
| 32 | `PATCH` | `/api/topics/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `{ topicName, subjectID }` | `{ success: true, data: Topic }` | `AdminQuestionBankPage` |
| 33 | `DELETE` | `/api/topics/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, message: "Topic deleted" }` | `AdminQuestionBankPage` |

### C. Subtopics (`/api/subtopics`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 34 | `POST` | `/api/subtopics` | Protected (`ADMIN`) | `{ subTopicName: string, topicID: string }` | `{ success: true, data: SubTopic }` | `AdminQuestionBankPage` |
| 35 | `GET` | `/api/subtopics` | Protected (`All Roles`) | Query: `?topicId=...` | `{ success: true, data: Array<SubTopic> }` | `AdminQuestionBankPage`, `AdminTestBuilderPage` |
| 36 | `GET` | `/api/subtopics/:id` | Protected (`All Roles`) | Path: `:id` | `{ success: true, data: SubTopic }` | `AdminQuestionBankPage` |
| 37 | `PATCH` | `/api/subtopics/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `{ subTopicName }` | `{ success: true, data: SubTopic }` | `AdminQuestionBankPage` |
| 38 | `DELETE` | `/api/subtopics/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, message: "SubTopic deleted" }` | `AdminQuestionBankPage` |

### D. Questions (`/api/questions`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 39 | `POST` | `/api/questions` | Protected (`ADMIN`) | `{ question: { en, te }, option: [{ id: 1, text: { en, te } }], correctOption: number, explaination: { en, te }, topicID, subTopicID, difficulty }` | `{ success: true, data: Question }` | `AdminQuestionBankPage` |
| 40 | `GET` | `/api/questions` | Protected (`ADMIN`) | Query: `?page=1&limit=20&topicId=...&difficulty=...` | `{ success: true, data: Array<Question>, pagination: Object }` | `AdminQuestionBankPage`, `AdminTestBuilderPage` |
| 41 | `POST` | `/api/questions/import/json` | Protected (`ADMIN`) | `{ questions: Array<QuestionObject> }` | `{ success: true, count: number, importedIds: Array }` | `AdminQuestionBankPage` (Bulk Import Modal) |
| 42 | `POST` | `/api/questions/import/csv` | Protected (`ADMIN`) | Multipart Form: `file: csvFile` | `{ success: true, count: number, warnings: Array }` | `AdminQuestionBankPage` (Bulk Import Modal) |
| 43 | `GET` | `/api/questions/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, data: Question }` | `AdminQuestionBankPage` (Question Inspector) |
| 44 | `PATCH` | `/api/questions/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `Partial<Question>` | `{ success: true, data: Question }` | `AdminQuestionBankPage` |
| 45 | `DELETE` | `/api/questions/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, message: "Question deleted" }` | `AdminQuestionBankPage` |

---

## 4. Platform & AI Settings

### A. Platform Settings (`/admin/settings`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 46 | `GET` | `/admin/settings` | Protected (`ADMIN`) | None | `{ success: true, data: { maintenanceMode, allowSignups, maxSessionsPerUser, paymentGatewayEnabled } }` | `AdminPlatformSettingsPage` |
| 47 | `PATCH` | `/admin/settings` | Protected (`ADMIN`) | `{ settings: Object }` | `{ success: true, data: Object }` | `AdminPlatformSettingsPage` |
| 48 | `GET` | `/admin/settings/:key` | Protected (`ADMIN`) | Path: `:key` | `{ success: true, key: string, value: any }` | `AdminPlatformSettingsPage` |
| 49 | `PATCH` | `/admin/settings/:key` | Protected (`ADMIN`) | Path: `:key`, Body: `{ value: any }` | `{ success: true, key: string, value: any }` | `AdminPlatformSettingsPage` |

### B. AI Assistant Settings (`/admin/ai-settings`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 50 | `GET` | `/admin/ai-settings` | Protected (`ADMIN`) | None | `{ success: true, data: { model: string, temperature: number, maxTokens: number, enableWebSearch: boolean, systemPrompt: string } }` | `AdminAiSettingsPage` |
| 51 | `PUT` | `/admin/ai-settings` | Protected (`ADMIN`) | `{ model, temperature, maxTokens, enableWebSearch, systemPrompt }` | `{ success: true, data: Object }` | `AdminAiSettingsPage` |

---

## 5. Exams & Online Assessments (`/api/tests`, `/api/exams`)

### A. Test Configuration & Management (`/api/tests`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 52 | `POST` | `/api/tests` | Protected (`ADMIN`) | `{ title, description, durationMinutes, totalMarks, sections: [{ name, questions: [id], marksPerQuestion, negativeMarkingCoefficient, randomizeQuestions }], scheduledWindow: { start, end } }` | `{ success: true, data: Test }` | `AdminTestBuilderPage` |
| 53 | `GET` | `/api/tests` | Protected (`All Roles`) | Query: `?status=...&page=1&limit=20` | `{ success: true, data: Array<Test>, pagination: Object }` | `StudentTestsCatalogPage`, `AdminTestBuilderPage` |
| 54 | `GET` | `/api/tests/:id` | Protected (`All Roles`) | Path: `:id` | `{ success: true, data: Test (without answer keys for students) }` | `TestInstructionModal`, `AdminTestBuilderPage` |
| 55 | `PATCH` | `/api/tests/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `Partial<Test>` | `{ success: true, data: Test }` | `AdminTestBuilderPage` |
| 56 | `DELETE` | `/api/tests/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, message: "Test deleted" }` | `AdminTestBuilderPage` |

### B. Exam Player & Student Lifecycle (`/api/exams`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 57 | `POST` | `/api/exams/:testId/start` | Protected (`STUDENT`) | Path: `:testId` | `{ success: true, data: { attemptId, testId, durationMinutes, expiresAt, questions: [{ _id, question: { en, te }, option: [{ id, text: { en, te } }], sectionId }] } }` | `ExamPlayerPage` |
| 58 | `PATCH` | `/api/exams/attempts/:attemptId/autosave` | Protected (`STUDENT`) | Path: `:attemptId`, Body: `{ questionId, selectedOption, status: "ANSWERED"\|"REVIEW"\|"UNANSWERED", timeSpentSeconds }` | `{ success: true, remainingTimeSeconds: number, expired?: boolean }` | `ExamPlayerPage` (Auto-sync) |
| 59 | `POST` | `/api/exams/attempts/:attemptId/submit` | Protected (`STUDENT`) | Path: `:attemptId` | `{ success: true, attemptId: string, message: "Exam submitted successfully" }` | `ExamPlayerPage` -> `TestScorecardPage` |
| 60 | `GET` | `/api/exams/attempts/:attemptId/review` | Protected (`STUDENT`) | Path: `:attemptId` | `{ success: true, attemptId, reviewData: Array<{ questionId, questionTextEn, questionTextTe, optionsEn, optionsTe, selectedOption, correctOption, status: "CORRECT"\|"INCORRECT"\|"UNATTEMPTED", marksObtained, timeSpentSeconds, explanationEn, explanationTe, topic, topicId }> }` | `SolutionReviewPage` |
| 61 | `GET` | `/api/exams/attempts/:attemptId/analytics` | Protected (`STUDENT`) | Path: `:attemptId` | `{ success: true, summary: { totalScore, totalQuestions, attemptedCount, correctCount, incorrectCount, skippedCount, accuracyPercentage }, timeAnalysis: { totalTimeSpentSeconds, avgTimeCorrectSeconds, avgTimeIncorrectSeconds, avgTimeSkippedSeconds }, topicBreakdown: Array, weakTopics: Array<{ topicName, accuracy, recommendation }> }` | `StudentAnalyticsPage` |

---

## 6. Daily Current Affairs & Semantic Linking

### A. Student & Public Endpoints (`/api/current-affairs`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 62 | `GET` | `/api/current-affairs` | Public/Protected | Query: `?category=STATE_AP\|NATIONAL\|ECONOMY\|POLITY&page=1&limit=15&search=...&date=YYYY-MM-DD` | `{ success: true, data: Array<CurrentAffair>, pagination: Object }` | `CurrentAffairsFeedPage` |
| 63 | `GET` | `/api/current-affairs/:id` | Public/Protected | Path: `:id` | `{ success: true, data: { _id, title, content, category, tags, publishedAt, relatedConcepts: Array<{ bookId, bookTitle, chapterId, chapterTitle, relevanceScore }> } }` | `ArticleReaderPage` |
| 64 | `POST` | `/api/current-affairs` | Protected (`ADMIN`) | `{ title, content, category, tags, thumbnail, scheduledAt }` | `{ success: true, data: CurrentAffair }` | `AdminCurrentAffairsEditorPage` |
| 65 | `POST` | `/api/current-affairs/:id/publish` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, data: CurrentAffair }` | `AdminCurrentAffairsEditorPage` |
| 66 | `PUT` | `/api/current-affairs/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `{ title, content, category, tags }` | `{ success: true, data: CurrentAffair }` | `AdminCurrentAffairsEditorPage` |
| 67 | `DELETE` | `/api/current-affairs/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, message: "Article deleted" }` | `AdminCurrentAffairsEditorPage` |

### B. Bookmarks (`/api/current-affairs/bookmarks`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 68 | `POST` | `/api/current-affairs/bookmarks/:currentAffairsId`| Protected (`STUDENT`) | Path: `:currentAffairsId` | `{ success: true, isBookmarked: boolean, message: string }` | `CurrentAffairsFeedPage`, `ArticleReaderPage` |
| 69 | `GET` | `/api/current-affairs/bookmarks/:currentAffairsId` | Protected (`STUDENT`) | Path: `:currentAffairsId` | `{ success: true, isBookmarked: boolean }` | `ArticleReaderPage` |
| 70 | `GET` | `/api/current-affairs/bookmarks` | Protected (`STUDENT`) | Query: `?page=1&limit=20` | `{ success: true, data: Array<CurrentAffairBookmark> }` | `StudentBookmarksPage` |

### C. Admin Current Affairs CMS (`/api/admin/current-affairs`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 71 | `POST` | `/api/admin/current-affairs` | Protected (`ADMIN`) | `{ title, content, category, tags, thumbnail, status: "DRAFT"\|"PUBLISHED", scheduledPublishDate }` | `{ success: true, data: CurrentAffair }` | `AdminCurrentAffairsEditorPage` |
| 72 | `GET` | `/api/admin/current-affairs` | Protected (`ADMIN`) | Query: `?status=...&category=...&page=1&limit=20` | `{ success: true, data: Array<CurrentAffair>, pagination: Object }` | `AdminCurrentAffairsListPage` |
| 73 | `GET` | `/api/admin/current-affairs/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, data: CurrentAffair }` | `AdminCurrentAffairsEditorPage` |
| 74 | `PUT` | `/api/admin/current-affairs/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `Object` | `{ success: true, data: CurrentAffair }` | `AdminCurrentAffairsEditorPage` |
| 75 | `PATCH` | `/api/admin/current-affairs/:id/status` | Protected (`ADMIN`) | Path: `:id`, Body: `{ status: "DRAFT"\|"PUBLISHED"\|"ARCHIVED" }` | `{ success: true, data: CurrentAffair }` | `AdminCurrentAffairsListPage` |
| 76 | `DELETE` | `/api/admin/current-affairs/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, message: "Deleted" }` | `AdminCurrentAffairsListPage` |

---

## 7. Cloudflare R2 Video Hosting (`/api/videos`)

| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 77 | `POST` | `/api/videos/upload` | Protected (`ADMIN`, `MENTOR`) | Multipart Form: `video: File (<= 500MB)`, Body: `{ title, description }` | `{ success: true, videoKey: string, r2Url: string }` | `AdminCourseBuilderPage`, `MentorContentUploadPage` |
| 78 | `GET` | `/api/videos/signed-url` | Protected (`All Roles`) | Query: `?videoKey=...` | `{ success: true, signedUrl: string, expiresIn: number }` | `VideoLecturePlayerPage`, `ChatLightbox` |
| 79 | `GET` | `/api/videos/signed-url/*r2Key` | Protected (`All Roles`) | Path: Wildcard key | `{ success: true, signedUrl: string, expiresIn: number }` | `VideoLecturePlayerPage` |

---

## 8. Razorpay Payments, Invoicing & Refunds

| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 80 | `POST` | `/api/payments/create-order` | Protected (`STUDENT`) | `{ courseId: string, priceTierId?: string, couponCode?: string }` | `{ success: true, orderId: string, razorpayOrderId: string, amount: number, currency: "INR", keyId: string }` | `CheckoutPage` |
| 81 | `POST` | `/api/payments/verify` | Protected (`STUDENT`) | `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }` | `{ success: true, message: "Payment verified successfully", order: Object, entitlement: Object }` | `CheckoutPage` (Callback) |
| 82 | `POST` | `/api/payments/coupons/validate`| Protected (`STUDENT`) | `{ couponCode: string, courseId: string, priceTierId?: string }` | `{ success: true, data: { couponCode, subtotal, discountAmount, finalAmount, currency } }` | `CheckoutPage` (Coupon Input Widget) |
| 83 | `GET` | `/api/payments/orders/:orderId/invoice` | Protected (`STUDENT`, `ADMIN`) | Path: `:orderId` | Binary Stream (`application/pdf`, download) | `StudentInvoicesPage`, `AdminFinancialsPage` |
| 84 | `POST` | `/api/payments/:paymentId/refunds` | Protected (`ADMIN`) | Path: `:paymentId`, Body: `{ amount?: number, reason?: string }` | `{ success: true, refund: { refundId, amount, status: "PROCESSED" } }` | `AdminFinancialsPage` (Refund Modal) |
| 85 | `POST` | `/api/webhooks/razorpay` | Razorpay Webhook | Raw JSON Body + `X-Razorpay-Signature` Header | `{ status: "ok" }` | External Razorpay Webhook Gateway |

---

## 9. Courses & Curriculum Bundles (`/api/admin/courses`)

| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 86 | `POST` | `/api/admin/courses` | Protected (`ADMIN`) | `{ title, description, thumbnail, validityInDays, basePrice, discountedPrice, targetExam, curriculum: Array<{ type: "BOOK"\|"TEST"\|"VIDEO", refId, title, order }> }` | `{ success: true, data: Course }` | `AdminCourseBuilderPage` |
| 87 | `GET` | `/api/admin/courses` | Protected (`All Roles`) | Query: `?status=PUBLISHED&search=...&page=1&limit=10` | `{ success: true, data: Array<Course>, pagination: Object }` | `StudentDashboardPage`, `CourseCatalogPage`, `AdminCourseListPage` |
| 88 | `GET` | `/api/admin/courses/:id` | Protected (`All Roles`) | Path: `:id` | `{ success: true, data: Course (with populated curriculum items) }` | `CourseDetailsPage`, `AdminCourseBuilderPage` |
| 89 | `PUT` | `/api/admin/courses/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `CourseObject` | `{ success: true, data: Course }` | `AdminCourseBuilderPage` |
| 90 | `DELETE` | `/api/admin/courses/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, message: "Course deleted" }` | `AdminCourseListPage` |
| 91 | `PUT` | `/api/admin/courses/:id/curriculum` | Protected (`ADMIN`) | Path: `:id`, Body: `{ curriculum: Array<{ type, refId, title, order }> }` | `{ success: true, data: Course }` | `AdminCourseBuilderPage` (Curriculum Tree) |
| 92 | `PATCH` | `/api/admin/courses/:id/status` | Protected (`ADMIN`) | Path: `:id`, Body: `{ status: "DRAFT"\|"PUBLISHED"\|"ARCHIVED" }` | `{ success: true, data: Course }` | `AdminCourseListPage` |

---

## 10. User Directory & Administration (`/api/admin/users`)

| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 93 | `GET` | `/api/admin/users` | Protected (`ADMIN`) | Query: `?search=...&role=STUDENT\|MENTOR\|ADMIN&status=ACTIVE\|SUSPENDED&page=1&limit=20` | `{ success: true, users: Array<User>, pagination: Object }` | `AdminUsersPage` |
| 94 | `GET` | `/api/admin/users/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, user: { _id, email, fullName, role, status, createdAt, activeSessionsCount, testAttempts: Array, enrolledCourses: Array } }` | `UserInspectorDrawer` |
| 95 | `PATCH` | `/api/admin/users/:id/status` | Protected (`ADMIN`) | Path: `:id`, Body: `{ status: "ACTIVE"\|"SUSPENDED" }` | `{ success: true, user: Object, message: string }` | `AdminUsersPage` |
| 96 | `POST` | `/api/admin/users/:id/revoke-sessions`| Protected (`ADMIN`) | Path: `:id` | `{ success: true, revokedCount: number, message: "All user sessions terminated" }` | `UserInspectorDrawer` |

---

## 11. Study Annotations, Notes & Bookmarks (`/api/annotations`)

| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 97 | `POST` | `/api/annotations` | Protected (`STUDENT`) | `{ bookId, chapterId, blockIndex, range: { startOffset, endOffset }, color: "YELLOW"\|"GREEN"\|"PINK"\|"BLUE", noteText?: string, isBookmark?: boolean }` | `{ success: true, data: Annotation }` | `AnnotationPopover` |
| 98 | `GET` | `/api/annotations/book/:bookId` | Protected (`STUDENT`) | Path: `:bookId`, Query: `?chapterId=...` | `{ success: true, data: Array<Annotation> }` | `BilingualReaderPage`, `NotesDrawer` |
| 99 | `PATCH` | `/api/annotations/:id` | Protected (`STUDENT`) | Path: `:id`, Body: `{ color?: string, noteText?: string }` | `{ success: true, data: Annotation }` | `NotesDrawer`, `AnnotationPopover` |
| 100 | `DELETE` | `/api/annotations/:id` | Protected (`STUDENT`) | Path: `:id` | `{ success: true, message: "Annotation deleted" }` | `NotesDrawer`, `AnnotationPopover` |

---

## 12. AI Assistant Vector Search (`/api/ai`)

| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 101 | `POST` | `/api/ai/vector-search` | Protected (`ADMIN`, `SUPER_ADMIN`) | `{ query: string, limit?: number, minScore?: number, filters?: object }` | `{ success: true, query: string, resultsCount: number, chunks: Array<{ textEn, textTe, bookId, bookTitle, pageNumber, chapterTitle, score }> }` | `AiAssistantDrawer`, `AdminAiSettingsPage` |

---

## 13. 1-on-1 Mentor Communication & Moderation

### A. Real-Time Chat Endpoints (`/api/chat`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 102 | `GET` | `/api/chat/threads` | Protected (`All Roles`) | Query: `?page=1&limit=20` | `{ success: true, threads: Array<{ threadId, peer: { _id, fullName, avatarUrl, role }, lastMessage: Object, unreadCount: number, updatedAt: Date }> }` | `ChatRoomPage` (Thread List) |
| 103 | `POST` | `/api/chat/threads` | Protected (`All Roles`) | `{ peerId: string, topic?: string }` | `{ success: true, thread: ThreadObject }` | `MentorDirectoryPage`, `ChatRoomPage` |
| 104 | `GET` | `/api/chat/threads/:threadId/messages`| Protected (`All Roles`) | Path: `:threadId`, Query: `?page=1&limit=50&before=timestamp` | `{ success: true, messages: Array<{ _id, senderId, content, messageType: "TEXT"\|"IMAGE"\|"PDF"\|"AUDIO", attachments: Array, isDelivered, isRead, createdAt }> }` | `ChatRoomPage` (Message Stream) |
| 105 | `GET` | `/api/chat/unread-count` | Protected (`All Roles`) | None | `{ success: true, totalUnreadCount: number, byThread: Record<string, number> }` | Global Navbar Unread Badge |
| 106 | `POST` | `/api/chat/reports` | Protected (`All Roles`) | `{ messageId?: string, threadId: string, reason: string, details?: string }` | `{ success: true, report: Object, message: "Report submitted" }` | `ReportModal` |
| 107 | `POST` | `/api/chat/messages/:messageId/report` | Protected (`All Roles`) | Path: `:messageId`, Body: `{ reason: string, details?: string }` | `{ success: true, report: Object }` | `ReportModal` |

### B. Admin Moderation & Audit Archive (`/api/admin/chat`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 108 | `GET` | `/api/admin/chat/reports` | Protected (`ADMIN`) | Query: `?status=PENDING\|RESOLVED&page=1&limit=20` | `{ success: true, reports: Array<{ _id, reporter: Object, reportedUser: Object, messageSnippet, reason, status, createdAt }> }` | `AdminChatModerationPage` |
| 109 | `GET` | `/api/admin/chat/reports/:id` | Protected (`ADMIN`) | Path: `:id` | `{ success: true, report: ReportDetailObject }` | `AdminChatModerationPage` |
| 110 | `PATCH` | `/api/admin/chat/reports/:id` | Protected (`ADMIN`) | Path: `:id`, Body: `{ resolution: "DISMISSED"\|"USER_WARNED"\|"USER_SUSPENDED", notes?: string }` | `{ success: true, report: Object }` | `AdminChatModerationPage` |
| 111 | `POST` | `/api/admin/chat/reports/:id/resolve` | Protected (`ADMIN`) | Alias for `PATCH /reports/:id` | `{ success: true, report: Object }` | `AdminChatModerationPage` |
| 112 | `GET` | `/api/admin/chat/audit-logs` | Protected (`ADMIN`) | Query: `?page=1&limit=20&actorId=...` | `{ success: true, logs: Array<AuditLog> }` | `AdminChatAuditPage` |
| 113 | `GET` | `/api/admin/chat/moderation-logs` | Protected (`ADMIN`) | Alias for `/audit-logs` | `{ success: true, logs: Array<AuditLog> }` | `AdminChatAuditPage` |
| 114 | `GET` | `/api/admin/chat/threads` | Protected (`ADMIN`) | Query: `?page=1&limit=20` | `{ success: true, threads: Array<ThreadObject> }` | `AdminChatAuditPage` |
| 115 | `GET` | `/api/admin/chat/threads/:threadId/transcript` | Protected (`ADMIN`) | Path: `:threadId` | `{ success: true, thread: Object, transcript: Array<ChatMessage> }` | `AdminChatAuditPage` (Transcript Drawer) |
| 116 | `GET` | `/api/admin/chat/transcripts/:threadId` | Protected (`ADMIN`) | Alias for transcript | `{ success: true, transcript: Array }` | `AdminChatAuditPage` |
| 117 | `GET` | `/api/admin/chat/messages/search` | Protected (`ADMIN`) | Query: `?query=term&startDate=...&endDate=...` | `{ success: true, matches: Array<{ messageId, threadId, sender, content, createdAt }> }` | `AdminChatAuditPage` |

---

## 14. Mentor Applications & Discovery

### A. Student & Public Mentor Endpoints (`/api/mentors`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 118 | `GET` | `/api/mentors` | Public/Protected | Query: `?subject=...&search=...` | `{ success: true, mentors: Array<{ _id, fullName, avatarUrl, bio, subjectExpertise: Array, rating, totalDoubtsResolved }> }` | `MentorDirectoryPage` |
| 119 | `POST` | `/api/mentors/apply` | Protected (`STUDENT`, `MENTOR`) | `{ subjectExpertise: Array<string>, bio: string, qualifications: string, linkedInUrl?: string }` | `{ success: true, application: Object, message: "Application submitted for review" }` | `MentorApplicationPage` |
| 120 | `POST` | `/api/mentors/:id/connect` | Protected (`STUDENT`) | Path: `:id`, Body: `{ initialMessage?: string, topic?: string }` | `{ success: true, threadId: string, message: "Connected with mentor" }` | `MentorDirectoryPage` -> `ChatRoomPage` |

### B. Admin Mentor Management (`/api/admin/mentors`)
| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 121 | `GET` | `/api/admin/mentors` | Protected (`ADMIN`) | Query: `?status=PENDING\|APPROVED\|REJECTED` | `{ success: true, applications: Array<MentorApplication> }` | `AdminMentorsPage` |
| 122 | `PATCH` | `/api/admin/mentors/:id/status` | Protected (`ADMIN`) | Path: `:id`, Body: `{ status: "APPROVED"\|"REJECTED", reason?: string }` | `{ success: true, application: Object }` | `AdminMentorsPage` |

---

## 15. System Health Check

| # | Method | Path | Auth / Role | Request Payload | Response Data | Consuming UI Pages |
|---|---|---|---|---|---|---|
| 123 | `GET` | `/health` | Public | None | `{ success: true, message: "Server is healthy" }` | Health Check Monitoring / Admin Status |

---

## 16. Socket.IO Real-Time Gateway & Events

**Endpoint URL:** `ws://<server-host>/socket.io`  
**Authentication:** Handshake headers `Authorization: Bearer <accessToken>` or query `auth: { token: "<accessToken>" }`.

### Client-to-Server Events
| Event Name | Payload | Callback Acknowledgement | Description |
|---|---|---|---|
| `join_thread` / `join_room` | `{ threadId: string }` | `(ack: { success: boolean, threadId: string, unreadCount: number }) => void` | Joins conversation thread room and marks incoming messages as delivered. |
| `leave_thread` / `leave_room` | `{ threadId: string }` | `(ack: { success: boolean, threadId: string }) => void` | Leaves the room. |
| `send_message` | `{ threadId: string, content: string, messageType?: "TEXT"\|"IMAGE"\|"PDF"\|"AUDIO", attachments?: Array, clientMessageId: string }` | `(ack: { success: boolean, message: Object, clientMessageId: string }) => void` | Transmits a message, triggers database persistence, and routes real-time push. |
| `mark_delivered` | `{ threadId: string, messageIds: Array<string> }` | `(ack: { success: boolean, messageIds: Array, deliveredAt: Date }) => void` | Updates message delivery status. |
| `mark_read` | `{ threadId: string, messageIds: Array<string> }` | `(ack: { success: boolean, messageIds: Array, readAt: Date, unreadCount: number }) => void` | Marks messages read and adjusts unread counts. |
| `get_unread_count` | `{ threadId?: string }` | `(ack: { success: boolean, unreadCount: number }) => void` | Fetches unread message tallies. |
| `typing_start` | `{ threadId: string }` | None | Emits typing state to peer in thread. |
| `typing_stop` | `{ threadId: string }` | None | Clears typing indicator. |

### Server-to-Client Events
| Event Name | Payload | Trigger / Purpose |
|---|---|---|
| `session_revoked` | `{ message: "Your session has been terminated due to login from another device" }` | **TASK-01.3.3**: Triggered when the user signs in from a second browser/device. Frontend displays modal and purges tokens. |
| `receive_message` / `new_message` | `ChatMessageObject & { clientMessageId?: string }` | Emitted to room when a new message arrives. |
| `messages_delivered` | `{ threadId: string, messageIds: Array<string>, deliveredAt: Date }` | Updates UI message delivery checkmarks (`✓✓`). |
| `messages_read` | `{ threadId: string, messageIds: Array<string>, readAt: Date }` | Updates UI blue checkmarks (`✓✓`). |
| `chat_notification` | `{ threadId: string, messageId: string, senderId: string, content: string, unreadCount: number }` | Real-time desktop/toast notification when user is outside the thread. |
| `unread_count_update` | `{ threadId: string, unreadCount: number }` | Dynamic badge update across UI navigation tabs. |
| `chat_error` | `{ success: false, threadId?: string, error: string, reason: string }` | Emitted on permission failure or validation error. |
