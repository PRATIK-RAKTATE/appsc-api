# P2 issues

Moderate functionality and data-quality findings from source review.

## P2-1 — Exam review can assign zero marks to answered questions

**Location:** `src/services/exam.service.js:182-190`, `src/models/testSection.model.js:55-61`

The review searches for a section with `s.questions.includes(q._id)`. Section question IDs and the freshly queried question ID are separate `ObjectId` instances; `Array.includes()` compares object identity, so the match can fail even when the values are equal. `marksPerQ` then defaults to `0`, producing incorrect marks and analytics. Compare IDs by string value instead.

**Reproduce:** Review a submitted exam with section questions loaded from MongoDB and inspect marks for correct answers.

## P2-2 — Analytics crashes when a question has no populated topic

**Location:** `src/services/exam.service.js:203-206,257-260`

Review explicitly allows a missing `topicID` with `topicId: q.topicID?._id`, but analytics immediately calls `item.topicId.toString()`. If a referenced topic was deleted, the analytics endpoint returns an error instead of the available summary.

**Reproduce:** Remove a topic referenced by a test question, submit an attempt, and request its analytics.

## P2-3 — Randomized exam question order changes on resume

**Location:** `src/services/exam.service.js:21-29,69-87`

When a test section has `randomizeQuestions` enabled, `_getSanitizedQuestions()` shuffles its questions each time it is called. The initial order is not saved in `ExamAttempt`; resuming the same attempt calls the shuffle again. Question positions can change mid-exam, while responses remain keyed to question IDs.

**Reproduce:** Start a randomized test, record the question order, then call the start endpoint again to resume that attempt.

## P2-4 — Initial mentor message is acknowledged but never stored

**Location:** `src/controllers/mentor.controller.js:177-221`

`POST /api/mentors/:id/connect` accepts `initialMessage` and returns it as `pendingMessage`, but does not create a `ChatMessage`. If the client treats the successful response as message delivery, the mentor never receives the text and it will be absent from the thread history.

**Reproduce:** Connect to an approved mentor with `initialMessage`, then fetch thread messages.

## P2-5 — Book upload confirmation can attach the wrong job to a book

**Location:** `src/services/book.service.js:138-175`

When both `bookId` and `uploadJobId` are supplied, the job is fetched by ID while the book is fetched from the independent `bookId`; their relationship is never checked. An admin client passing a valid job for book A with book B's ID marks A's job completed and puts A's file URL on B.

**Reproduce:** Call `POST /api/books/:id/confirm-upload` using book B's ID and book A's upload job ID.
