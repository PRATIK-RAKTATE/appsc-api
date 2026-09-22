# Graph Report - appsc-api  (2026-09-22)

## Corpus Check
- 246 files · ~87,496 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .example 1)

## Summary
- 950 nodes · 2277 edges · 36 communities (35 shown, 1 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 161 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Payments and Billing
- Annotations and Threads
- Exam Sessions
- Book Content
- Question Taxonomy
- Users and Authentication
- Videos and Backups
- Current Affairs
- Courses and Entitlements
- Platform Settings Audit
- AI Vector Retrieval
- Product Requirements
- Mentor Management
- Socket Connections
- Package Metadata
- Chat Thread Service
- Test Management
- Runtime Dependencies
- Subject Management
- Redis Workers
- Topic Management
- Backup Storage
- Learning Progress Models
- Chat Moderation Models
- Chat Administration
- Student Annotation Model
- API CI Governance
- Application Bootstrap
- Chat Message Model
- Knowledge Chunk Queue
- Development Dependencies
- Package Scripts
- Environment Bootstrap
- Android CI
- Web CI
- Change Management

## God Nodes (most connected - your core abstractions)
1. `mongoose` - 103 edges
2. `vitest` - 91 edges
3. `express` - 28 edges
4. `verifyToken()` - 21 edges
5. `requireRole()` - 14 edges
6. `User` - 13 edges
7. `mongodb-memory-server` - 12 edges
8. `USER_ROLES` - 12 edges
9. `auditLog()` - 11 edges
10. `Course` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Current Affairs Authorization Bypass` --semantically_similar_to--> `Anonymous Exam Data Mutation`  [INFERRED] [semantically similar]
  issuesP1.md → issuesP0.md
- `Unpublished Current Affairs Exposure` --semantically_similar_to--> `Public Answer Key Disclosure`  [INFERRED] [semantically similar]
  issuesP1.md → issuesP0.md
- `Missing Course Entitlement Checks` --conceptually_related_to--> `Validity-Based Entitlement`  [INFERRED]
  issuesP1.md → docs/requirements/appsc-sow.html
- `Refund Retains Course Access` --conceptually_related_to--> `Validity-Based Entitlement`  [INFERRED]
  issuesP1.md → docs/requirements/appsc-sow.html
- `Exam Submission Deadline Bypass` --conceptually_related_to--> `Online Tests and Performance Analytics`  [INFERRED]
  issuesP1.md → docs/requirements/appsc-sow.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Continuous Integration Build and Test Pipelines** — _github_workflows_api_ci_api_test_job, _github_workflows_mobile_android_build_android_job, _github_workflows_web_ci_build_web_job [INFERRED 0.95]
- **Course Access and Payment Integrity** — docs_requirements_appsc_sow_courses_and_payments, docs_requirements_appsc_sow_validity_based_entitlement, issuesp0_checkout_schema_mismatch, issuesp1_missing_course_entitlement_checks, issuesp1_refund_retains_course_access, issuesp1_payment_confirmation_not_idempotent [INFERRED 0.95]
- **Test and Analytics Correctness** — docs_requirements_appsc_sow_online_tests_and_analytics, issuesp1_exam_deadline_bypass, issuesp2_exam_review_zero_marks, issuesp2_analytics_missing_topic_crash, issuesp2_randomized_order_changes_on_resume [INFERRED 0.95]

## Communities (36 total, 1 thin omitted)

### Community 0 - "Payments and Billing"
Cohesion: 0.06
Nodes (55): ref_crypto, pdfkit, razorpay, createOrderController(), downloadInvoiceController(), razorpayWebhookController(), refundPaymentController(), sendError() (+47 more)

### Community 1 - "Annotations and Threads"
Cohesion: 0.05
Nodes (52): express, multer, listMentorApplications(), createAnnotation(), deleteAnnotation(), getBookAnnotations(), isValidObjectId(), updateAnnotation() (+44 more)

### Community 2 - "Exam Sessions"
Cohesion: 0.06
Nodes (51): mongodb-memory-server, supertest, vitest, autosaveAnswerController(), getAnalyticsController(), getReviewController(), startExamController(), submitExamController() (+43 more)

### Community 3 - "Book Content"
Cohesion: 0.08
Nodes (49): confirmUploadController(), createBookBlockController(), createBookController(), deleteBookController(), failUploadController(), getBookByIdController(), getBookReaderController(), getBookUploadJobsController() (+41 more)

### Community 4 - "Question Taxonomy"
Cohesion: 0.08
Nodes (41): createQuestionController(), deleteQuestionController(), getQuestionByIdController(), getQuestionsController(), importQuestionsCsvController(), importQuestionsJsonController(), updateQuestionController(), createSubTopicController() (+33 more)

### Community 5 - "Users and Authentication"
Cohesion: 0.08
Nodes (37): bcryptjs, jsonwebtoken, nodemailer, escapeRegex(), getUserDetail(), getUsers(), revokeUserSessions(), updateUserStatus() (+29 more)

### Community 6 - "Videos and Backups"
Cohesion: 0.06
Nodes (37): @aws-sdk/s3-request-presigner, ref_node_child_process, node-cron, ref_node_crypto, ref_node_fs, ref_node_os, ref_node_path, ref_node_stream (+29 more)

### Community 7 - "Current Affairs"
Cohesion: 0.11
Nodes (30): createCurrentAffairsController(), deleteCurrentAffairsController(), getCurrentAffairsByIdController(), getCurrentAffairsController(), publishCurrentAffairsController(), updateCurrentAffairsController(), updateCurrentAffairStatusController(), Category (+22 more)

### Community 8 - "Courses and Entitlements"
Cohesion: 0.10
Nodes (29): createCourse(), deleteCourse(), getCourse(), getCourses(), updateCourse(), updateCourseStatus(), updateCurriculum(), expireEntitlements() (+21 more)

### Community 9 - "Platform Settings Audit"
Cohesion: 0.11
Nodes (24): getAiSettingsController(), updateAiSettingsController(), getAllPlatformSettingsController(), getPlatformSettingController(), updatePlatformSettingController(), updatePlatformSettingsController(), auditLog(), defaultCaptureChanges() (+16 more)

### Community 10 - "AI Vector Retrieval"
Cohesion: 0.09
Nodes (19): openRouterConfig, vectorSearchController(), ContentChunk, ContentChunkSchema, CurrentAffairsChunk, currentAffairsChunkSchema, cleanTextForRAG(), deleteCurrentAffairsRAG() (+11 more)

### Community 11 - "Product Requirements"
Cohesion: 0.09
Nodes (31): Acceptance Criteria, Admin-Controlled Content, APPSC Prep, Bilingual E-Book Reader, Content Protection, Courses and Razorpay Payments, Current Affairs Workflow, Mentor Chat (+23 more)

### Community 12 - "Mentor Management"
Cohesion: 0.14
Nodes (18): isValidObjectId(), updateMentorStatus(), applyForMentor(), browseMentors(), connectWithMentor(), escapeRegex(), isValidObjectId(), sanitiseStringArray() (+10 more)

### Community 13 - "Socket Connections"
Cohesion: 0.12
Nodes (15): isUserInRoom(), registerChatSocketHandlers(), emitSessionRevoked(), registerSocketHandlers(), resetUserSockets(), sessionSockets, userSockets, {
  authorizeThreadAccessMock,
  saveMessageMock,
  markMessagesDeliveredMock,
  markMessagesReadMock,
  getUnreadCountMock,
  getUserUnreadCountsMock,
} (+7 more)

### Community 14 - "Package Metadata"
Cohesion: 0.11
Nodes (18): author, bugs, url, description, directories, doc, homepage, keywords (+10 more)

### Community 15 - "Chat Thread Service"
Cohesion: 0.19
Nodes (14): authorizeThreadAccess(), findOrCreateThread(), getThreadMessages(), getUnreadCount(), getUserThreads(), getUserUnreadCounts(), markMessagesDelivered(), markMessagesRead() (+6 more)

### Community 16 - "Test Management"
Cohesion: 0.24
Nodes (13): createTestController(), deleteTestController(), getTestByIdController(), getTestsController(), updateTestController(), router, createTest(), deleteTest() (+5 more)

### Community 17 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcryptjs, bullmq, csv-parse, dotenv, express (+9 more)

### Community 18 - "Subject Management"
Cohesion: 0.26
Nodes (12): createSubjectController(), deleteSubjectController(), getSubjectByIdController(), getSubjectsController(), updateSubjectController(), router, createSubject(), deleteSubject() (+4 more)

### Community 19 - "Redis Workers"
Cohesion: 0.18
Nodes (9): bullmq, dotenv, ioredis, redisConnection, translationQueue, saveReadingProgress(), {
  mockIngestCurrentAffairsRAG,
  mockWorker,
}, worker (+1 more)

### Community 20 - "Topic Management"
Cohesion: 0.29
Nodes (11): createTopicController(), deleteTopicController(), getTopicByIdController(), getTopicsController(), updateTopicController(), createTopic(), deleteTopic(), getTopicById() (+3 more)

### Community 21 - "Backup Storage"
Cohesion: 0.19
Nodes (13): @aws-sdk/client-s3, ref_child_process, ref_fs, ref_stream, ref_util, R2_BUCKET_NAME, R2_SIGNED_URL_EXPIRY_SECONDS, r2Client (+5 more)

### Community 22 - "Learning Progress Models"
Cohesion: 0.20
Nodes (9): mongoose, leaderboardEntrySchema, LeaderboardSnapshot, leaderboardSnapshotSchema, ReadingProgress, readingProgressSchema, Video, VIDEO_STATUS (+1 more)

### Community 23 - "Chat Moderation Models"
Cohesion: 0.25
Nodes (8): ChatReport, chatReportSchema, REPORT_REASON, REPORT_STATUS, MODERATION_ACTION, ModerationLog, moderationLogSchema, USER_STATUS

### Community 24 - "Chat Administration"
Cohesion: 0.49
Nodes (9): escapeRegex(), getAuditLogs(), getReportById(), getReports(), getThreads(), getThreadTranscript(), parsePagination(), resolveReport() (+1 more)

### Community 25 - "Student Annotation Model"
Cohesion: 0.36
Nodes (7): Annotation, ANNOTATION_COLOR, ANNOTATION_LANGUAGE, ANNOTATION_TYPE, rangeSchema, StudentAnnotation, studentAnnotationSchema

### Community 26 - "API CI Governance"
Cohesion: 0.29
Nodes (8): API Test Job, Node.js API CI, Node Version Matrix, Test Environment Stubs, Branch and Commit Discipline, Contributing Guide, Pull Request Quality Gate, Secret Handling Policy

### Community 27 - "Application Bootstrap"
Cohesion: 0.38
Nodes (5): ref_http, socket.io, app, connectDB(), startServer()

### Community 28 - "Chat Message Model"
Cohesion: 0.47
Nodes (4): attachmentSchema, CHAT_MESSAGE_TYPE, ChatMessage, chatMessageSchema

### Community 29 - "Knowledge Chunk Queue"
Cohesion: 0.40
Nodes (3): knowledgeChunkQueue, scheduleKnowledgeChunking(), {
  mockGetJob,
  mockAdd,
  mockRemove,
  mockQueue,
}

### Community 30 - "Development Dependencies"
Cohesion: 0.40
Nodes (5): devDependencies, mongodb-memory-server, nodemon, supertest, vitest

### Community 31 - "Package Scripts"
Cohesion: 0.40
Nodes (5): scripts, backup:mongodb, dev, start, test

### Community 32 - "Environment Bootstrap"
Cohesion: 0.40
Nodes (4): ref_path, ref_url, __dirname, __filename

### Community 33 - "Android CI"
Cohesion: 0.67
Nodes (3): Build Android Job, Debug APK Artifact, React Native Android APK Build

### Community 34 - "Web CI"
Cohesion: 0.67
Nodes (3): Build Web Job, React Web CI Build, Web Build Artifact

## Knowledge Gaps
- **192 isolated node(s):** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `bcryptjs`, `bullmq`, `csv-parse` (+187 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 251 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Exam Sessions` to `Payments and Billing`, `Annotations and Threads`, `Book Content`, `Question Taxonomy`, `Users and Authentication`, `Videos and Backups`, `Current Affairs`, `Courses and Entitlements`, `Platform Settings Audit`, `AI Vector Retrieval`, `Mentor Management`, `Socket Connections`, `Package Metadata`, `Chat Thread Service`, `Test Management`, `Subject Management`, `Redis Workers`, `Topic Management`, `Learning Progress Models`, `Chat Moderation Models`, `Student Annotation Model`, `Chat Message Model`, `Knowledge Chunk Queue`?**
  _High betweenness centrality (0.356) - this node is a cross-community bridge._
- **Why does `mongoose` connect `Learning Progress Models` to `Payments and Billing`, `Annotations and Threads`, `Exam Sessions`, `Book Content`, `Question Taxonomy`, `Users and Authentication`, `Current Affairs`, `Courses and Entitlements`, `Platform Settings Audit`, `AI Vector Retrieval`, `Mentor Management`, `Socket Connections`, `Package Metadata`, `Chat Thread Service`, `Chat Moderation Models`, `Chat Administration`, `Student Annotation Model`, `Application Bootstrap`, `Chat Message Model`?**
  _High betweenness centrality (0.308) - this node is a cross-community bridge._
- **Why does `express` connect `Annotations and Threads` to `Payments and Billing`, `Exam Sessions`, `Book Content`, `Question Taxonomy`, `Users and Authentication`, `Current Affairs`, `Courses and Entitlements`, `Platform Settings Audit`, `Package Metadata`, `Test Management`, `Subject Management`, `Topic Management`, `Chat Administration`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `verifyToken()` (e.g. with `adminChat.routes.js` and `adminCourse.routes.js`) actually correct?**
  _`verifyToken()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `bcryptjs` to the rest of the system?**
  _192 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Payments and Billing` be split into smaller, more focused modules?**
  _Cohesion score 0.05642080517190714 - nodes in this community are weakly interconnected._
- **Should `Annotations and Threads` be split into smaller, more focused modules?**
  _Cohesion score 0.05160628844839371 - nodes in this community are weakly interconnected._