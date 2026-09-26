# P0 issues

Critical issues that block core use or allow unauthenticated modification or disclosure of exam content. Findings are from source review; no production data was changed.

## P0-1 — Access token returned by login is rejected by protected routes

**Location:** `src/services/auth.service.js:60-70`, `src/middleware/auth.middleware.js:29-33`, `src/models/user.model.js:65-68`

`createAuthTokens()` signs the initial access token without `tokenVersion`. `verifyToken()` requires that claim to equal the user's numeric `tokenVersion` (default `0`). Therefore a successful `/api/auth/verify-otp` response immediately produces an access token that receives `401 Token has been revoked` on every protected HTTP route. Refreshing the token happens to add the missing claim.

**Reproduce:** Verify an OTP, then use the returned `accessToken` on `GET /api/auth/me`.

## P0-2 — Anonymous callers can create, alter, import, and delete exam data

**Location:** `src/routes/question.routes.js:15-22`, `src/routes/test.routes.js:13-17`, `src/routes/subject.routes.js`, `src/routes/topic.routes.js`, `src/routes/subTopic.routes.js`

These routes have no authentication or role middleware. Anyone who can reach the API can create or delete questions and tests, bulk import questions, and alter the subject/topic hierarchy. This permits exam tampering and destructive data loss without an account.

**Reproduce:** Call `DELETE /api/questions/:id` or `PATCH /api/tests/:id` without an Authorization header, using an existing ID.

## P0-3 — Public question endpoints disclose answer keys

**Location:** `src/routes/question.routes.js:16,20`, `src/services/question.service.js:53-70`, `src/models/question.model.js:84-93`

`GET /api/questions` and `GET /api/questions/:id` are public and return whole Question documents. Those documents include `correctOption` and `explaination`. A caller can retrieve the answer bank without starting or submitting an exam.

**Reproduce:** Request `GET /api/questions` without a token and inspect `data[*].correctOption`.

## P0-4 — Checkout cannot price courses created under the current schema

**Location:** `src/services/payment.service.js:44-50,62`, `src/models/course.model.js:80-100`

Checkout reads `course.pricing.salePrice`, `course.pricing.amount`, `course.pricing.currency`, and `course.validityDays`. The Course schema stores `discountedPrice`, `basePrice`, and `validityInDays`; it has no `pricing` object or `validityDays`. For a normal course, dereferencing `course.pricing.salePrice` throws before the Razorpay order is created, so course purchases fail.

**Reproduce:** Create a published course using the Course schema fields, then call `POST /api/payments/create-order` for it with a valid refreshed access token.
