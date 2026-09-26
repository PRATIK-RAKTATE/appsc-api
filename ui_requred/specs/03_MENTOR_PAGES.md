# Specification 03: Mentor Experience & Doubt Resolution Portal

This document specifies the pages, real-time communication subsystems, multimedia uploading mechanisms, and doubt resolution workflows for educators and mentors.

---

## 📌 Issue References
- **Issue #55 [TASK-04.1.3]**: Mentor Approval Portal and Student Mentor Selection Directory
- **Issue #58 [TASK-04.2.3]**: 1-on-1 Real-time Chat UI in React.js + Tailwind CSS v4
- **Issue #61 [TASK-04.3.2]**: In-Chat Image/PDF Uploader & Lightbox Viewer
- **Issue #65 [TASK-04.4.3]**: In-Chat Report Modal and Moderation Flags
- **Issue #92 [TASK-07.2.2]**: Video Lecture & Multimedia Upload to Cloudflare R2

---

## 1. Mentor Application & Onboarding (`MentorApplicationPage`)
- **Route:** `/mentor-apply`
- **Issue:** #55 ([TASK-04.1.3])
- **Form Specifications:**
  - Full Name, Email, Phone Number
  - Multi-select Subject Expertise (e.g. *General Science, AP Economy, Indian Polity, Modern History*)
  - Educational Background & Teaching Credentials
  - Short Bio (max 500 characters)
  - Optional LinkedIn or Educational Channel URL
  - File uploader for Certificate / Resume (PDF <= 10MB)
- **API Flow:**
  - Submits to `POST /api/mentors/apply`.
  - Application enters `PENDING` state, awaiting administrator review on `/admin/mentors`.
  - Confirmation screen displays: *"Application Submitted. Our team reviews educator credentials within 24-48 hours."*

---

## 2. Mentor Dashboard & Query Hub (`MentorDashboardPage`)
- **Route:** `/mentor/dashboard` | Layout: `MentorLayout`
- **Key Metrics & Sections:**
  1. **Doubt Resolution Statistics**:
     - Total Assigned Students
     - Active Threads
     - Resolved Doubts (This Month / All-time)
     - Average Response Time
  2. **Pending Inquiries Queue**:
     - List of threads with unread messages from students, sorted chronologically with the longest-waiting question on top.
  3. **Quick Jump Button**:
     - *"Open Chat Room"* button jumping directly into the active inquiry thread.

---

## 3. Real-Time 1-on-1 Doubt Resolution Chat (`ChatRoomPage`)
- **Route:** `/mentor/chat` & `/mentor/chat/:threadId`
- **Issues:** #58 ([TASK-04.2.3]), #61 ([TASK-04.3.2]), #65 ([TASK-04.4.3])

### Layout Architecture
```text
<ChatRoomPage>
  ├── <ThreadListSidebar /> (Left column, 340px width)
  │     ├── <ThreadSearchBar />
  │     └── <ThreadCards> (Student avatar, name, last snippet, timestamp, unread badge)
  └── <ActiveChatWindow /> (Main pane)
        ├── <ChatHeader /> (Student name, exam goal, action menu)
        ├── <MessageFeed /> (Chronological message bubbles, date separators)
        │     ├── <TextMessageBubble />
        │     ├── <ImageMessageBubble /> (With Lightbox zoom trigger)
        │     ├── <PdfMessageBubble /> (With download & preview)
        │     └── <VoiceNoteBubble /> (With audio waveform player)
        ├── <TypingIndicator /> ("Student is typing...")
        └── <MessageComposerBar />
              ├── <AttachmentButton /> (Image / PDF upload)
              ├── <VoiceRecordButton /> (Mic recording with waveform)
              ├── <MessageTextInput />
              └── <SendButton />
```

### Real-Time Socket.IO Synchronization
1. **Thread Room Management**:
   - On opening thread, client emits `join_thread` with `{ threadId }`.
   - Backend marks messages delivered and responds with unread count.
2. **Message Transmission**:
   - Mentors submit text, images, or voice notes -> emits `send_message` with `{ threadId, content, messageType, attachments, clientMessageId }`.
   - Message displays optimistically with pending clock icon.
   - On server acknowledgement, displays single tick (`✓`).
   - When student receives message, displays double tick (`✓✓`).
   - When student views message, displays blue double ticks (`✓✓`).
3. **Multimedia Uploader (Issue #61)**:
   - Direct upload to Cloudflare R2 via presigned URLs.
   - Images render in chat bubbles; clicking opens `LightboxViewer` with zoom and pan controls (ideal for reading handwritten math or polity diagrams).
   - PDFs render with file name, size, and preview button.
   - Voice Notes record audio using the browser `MediaRecorder` API and stream as `.webm` / `.mp3`.
4. **In-Chat Report Modal (Issue #65)**:
   - Context menu on any message includes *"Report Inappropriate Message"*.
   - Opens modal with predefined reasons: Harassment, Spam, Off-topic, Impersonation.
   - Submits report to `POST /api/chat/reports`.

---

## 4. Mentor Video & Resource Uploader (`MentorContentUploadPage`)
- **Route:** `/mentor/content` | Layout: `MentorLayout`
- **Issue:** #92 ([TASK-07.2.2])
- **Components:**
  - Drag-and-drop video file dropzone (supports MP4, MKV up to 500MB).
  - Real-time chunked upload progress bar with upload speed (MB/s) and estimated time remaining.
  - Video Metadata Editor: Title, Description, Subject, Topic, Duration.
  - Table of uploaded videos with status: `UPLOADING`, `PROCESSING`, `READY`.
  - Preview button opening HTML5 player with signed R2 streaming URL.
