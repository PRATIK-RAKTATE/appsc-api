# P1 issues

High impact security and correctness findings from source review.

## P1-1 — Any signed-in user can publish, edit, or delete current-affairs articles

**Location:** `src/routes/currentAffairs.routes.js:16-19`, `src/controllers/currentAffairs.controller.js:33,70-75,158-165,225-231`

The public-facing write routes require a valid token but no admin role; their controllers perform no ownership or role check. A STUDENT can create an article, publish an existing article, edit it, or delete it. The separate admin routes do enforce `ADMIN`, so this bypasses their protection.

**Reproduce:** As a STUDENT with a refreshed token, call `DELETE /api/current-affairs/:id` or `POST /api/current-affairs/:id/publish`.

## P1-2 — Book reader and exam start skip paid-course entitlement checks

**Location:** `src/routes/book.routes.js:77-105`, `src/services/book.service.js:410-433`, `src/routes/exam.routes.js:13-17`, `src/services/exam.service.js:11-43`, `src/middleware/entitlementGuard.js:5-63`

The reader returns complete chapters and blocks to any authenticated user; exam start also checks only authentication. `requireActiveEntitlement` exists but is not mounted on either route. If these books or tests are sold as course content, a user without that course can read them or take its exam.

**Reproduce:** With a valid account that has no course entitlement, request a known book's `/api/books/:bookId/reader` or start a known test with `/api/exams/:testId/start`.

## P1-3 — Full refund leaves course access active

**Location:** `src/services/refund.service.js:50-59`, `src/services/video.service.js:54-65`, `src/models/userEntitlement.model.js:45-50`

On a full refund, the transaction, order, and invoice are marked refunded. The user's `UserEntitlement` is not revoked or expired. The video access check relies on that active entitlement, so access persists until its original expiry after the customer is refunded.

**Reproduce:** Fully refund a successful course payment and inspect the user's entitlement or request a signed URL for a course video.

## P1-4 — Payment confirmation is not idempotent and can undo refund state

**Location:** `src/services/payment.service.js:87-136`, `src/controllers/payment.controller.js:86-128`

`markOrderPaid()` runs its entitlement update on every valid checkout confirmation or webhook, including duplicates. It resets `startsAt` and `expiresAt` from the current time. Its order update accepts every status except `PAID`, so a replay after refund changes `REFUNDED` back to `PAID`, and its transaction update sets `REFUNDED` back to `SUCCESS`. Duplicate delivery can extend access; a late replay can reverse recorded refund status.

**Reproduce:** Process a payment, then deliver the same signed payment event again later; compare entitlement expiry. Repeat after a full refund and compare order/transaction statuses.

## P1-5 — Revoked sessions can keep using existing access tokens

**Location:** `src/services/auth.service.js:22-38`, `src/middleware/auth.middleware.js:17-45`, `src/services/socket.service.js:16-35,101-114`

New login revokes old `UserSession` records, but HTTP token verification checks only JWT validity and the account-level `tokenVersion`; it never checks the token's `sid` against the session record. Socket authentication also checks only the JWT and leaves existing sockets connected after emitting `session_revoked`. A previously signed access token remains usable until its 15-minute expiry, and an already connected socket can keep receiving and sending events unless the client voluntarily disconnects.

**Reproduce:** Log in on device A, then device B. Use A's still-valid access token or existing socket after the session on A is marked revoked.

## P1-6 — OTP verification has no failed-attempt limit

**Location:** `src/controllers/auth.controller.js:54-69`, `src/services/otp.service.js:30-56`, `src/services/otpRateLimit.service.js:7-87`

Only OTP sending is rate limited. The `/verify-otp` endpoint performs an unlimited number of comparisons against the same six-digit code during its 10-minute lifetime. It neither counts failed attempts nor invalidates the code on failure, allowing online code guessing.

**Reproduce:** Send many incorrect `POST /api/auth/verify-otp` requests for one email and observe that none are throttled or lock the OTP.

## P1-7 — Exam submission can bypass the deadline

**Location:** `src/services/exam.service.js:90-139`

`autosaveAnswer()` checks expiry, but `submitExam()` does not check `expiresAt` or require `IN_PROGRESS` before changing status to `SUBMITTED`. A student can submit an expired attempt, and a repeat request can overwrite `submittedAt`. In-flight autosave updates can also race with submission because the write filter contains no status or expiry condition.

**Reproduce:** Start a short exam, wait past `expiresAt`, then call `/api/exams/attempts/:attemptId/submit` without first calling autosave.

## P1-8 — Anonymous readers can see draft and archived current-affairs content

**Location:** `src/routes/currentAffairs.routes.js:14-15`, `src/services/currentAffairs.service.js:83-112,147-153`

The anonymous list and detail routes do not restrict results to `PUBLISHED`. The list defaults to an unfiltered query and accepts `?status=DRAFT`; the detail path looks up any ID. Unpublished editorial content is exposed before approval.

**Reproduce:** Call `GET /api/current-affairs?status=DRAFT` without a token.
