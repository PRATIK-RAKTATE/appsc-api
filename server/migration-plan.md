# Feature-Based Architecture Migration Plan

## Goal

Migrate the API from horizontal technical folders (`controllers/`, `services/`, `models/`, `routes/`, and so on) to feature-owned modules without changing public API behavior, database collections, job behavior, or Socket.IO events.

The migration should be incremental. Each feature moves as a complete vertical slice, remains deployable after every pull request, and keeps its tests passing before the next feature is moved.

## Execution Status

Implemented on the local `migration` branch on 2026-09-22:

- [x] Domain code moved into the 15 feature modules described below.
- [x] Tests colocated under each owning module; cross-feature integration tests remain under root `tests/integration/`.
- [x] Shared audit, backup, email, storage, middleware, and utility code separated from domain modules.
- [x] Module domain APIs exposed through `index.js`; HTTP composition APIs exposed through `routes/index.js` to avoid eager route and queue side effects.
- [x] `app.js`, `server.js`, and the MongoDB backup package script updated to the new paths.
- [x] Cross-module imports routed through public APIs.
- [x] Automated boundary validation added as `npm run check:boundaries`.
- [x] Legacy horizontal source folders removed.
- [x] Full test suite passing: 89 test files and 1,017 tests.

## Target Structure

```text
src/
├── app.js
├── server.js
├── config/
│   ├── env.js
│   ├── db.js
│   ├── redis.js
│   ├── r2.js
│   ├── openrouter.js
│   └── vector-indexes/
├── shared/
│   ├── middleware/
│   │   └── audit.middleware.js
│   ├── utils/
│   │   └── searchHelper.js
│   └── infrastructure/
│       ├── audit/
│       ├── backup/
│       ├── email/
│       └── storage/
└── modules/
    ├── auth/
    ├── users/
    ├── mentors/
    ├── books/
    ├── annotations/
    ├── question-bank/
    ├── exams/
    ├── courses/
    ├── videos/
    ├── payments/
    ├── entitlements/
    ├── chat/
    ├── ai-assistant/
    ├── current-affairs/
    └── platform-settings/
```

Each module should use only the folders it needs. Do not create empty folders just to make every module identical.

```text
modules/<feature>/
├── index.js                 # public module API; optional until needed
├── <feature>.routes.js
├── controllers/
├── services/
├── models/
├── middleware/
├── queues/
├── workers/
├── jobs/
├── handlers/
└── __tests__/
```

For a small feature, keeping files directly under the module is acceptable:

```text
modules/annotations/
├── annotation.model.js
├── annotation.controller.js
├── annotation.routes.js
└── __tests__/
```

The rule is feature ownership, not maximum nesting.

## Current State

The current `src/` layout is organized by technical layer:

| Area | Current files |
| --- | ---: |
| Controllers | 22 |
| Services | 33 |
| Models | 43 |
| Routes | 23 |
| Middleware | 3 |
| Queues | 4 |
| Workers | 3 |
| Jobs | 2 |
| Socket handlers | 1 |
| Unit tests under `src/tests` | 87 |

Important boot-time behavior that must not change:

- `src/app.js` mounts all HTTP routes and exposes `GET /health`.
- `POST /api/webhooks/razorpay` must remain before `express.json()` because Razorpay verifies the raw request body.
- `src/server.js` loads environment configuration before application services.
- `src/server.js` starts the knowledge-chunk, reading-progress, and current-affairs RAG workers.
- `src/server.js` starts the MongoDB backup and entitlement-expiry schedules.
- `src/server.js` creates Socket.IO and registers chat socket handlers.

## Module Ownership Map

This is the proposed destination for every current domain file. Exact file names can remain unchanged during the first pass to keep diffs reviewable.

### `auth`

- `auth.controller.js`, `auth.service.js`, `auth.routes.js`
- `otp.model.js`, `otpRateLimit.model.js`, `userSession.model.js`
- `otp.service.js`, `otpRateLimit.service.js`
- `auth.middleware.js`
- Authentication, OTP, token refresh, login sessions, and role-checking behavior

`auth` may read the public user API, but user profile and lifecycle behavior belongs to `users`.

### `users`

- `user.model.js`
- `adminUser.controller.js`, `adminUser.routes.js`
- User administration and account lifecycle

The `User` model is owned by `users`. Other modules should import it through `modules/users/index.js` once module boundaries are enforced.

### `mentors`

- `mentorProfile.model.js`, `studentMentorThread.model.js`
- `mentor.controller.js`, `adminMentor.controller.js`
- `mentor.routes.js`, `adminMentor.routes.js`

The mentor thread aggregate is owned here; chat messages and moderation remain in `chat`.

### `books`

- `book.model.js`, `chapter.model.js`, `bookBlock.model.js`
- `readingProgress.model.js`, `uploadJob.model.js`, `knowledgeChunk.model.js`
- `book.controller.js`, `book.service.js`, `book.routes.js`
- `knowledgeChunk.service.js`, `readingProgress.queue.service.js`
- `knowledgeChunk.queue.js`, `readingProgress.queue.js`
- `knowledgeChunk.worker.js`, `readingProgress.worker.js`

Book ingestion owns knowledge-chunk creation. Generic embedding generation may be supplied by `ai-assistant` through its public API.

### `annotations`

- `annotation.model.js`, `studentAnnotation.model.js`
- `annotation.controller.js`, `annotation.routes.js`

Before moving these files, confirm whether both annotation models are active representations of the same concept. Do not merge schemas as part of the folder migration.

### `question-bank`

- `subject.model.js`, `topic.model.js`, `subTopic.model.js`, `question.model.js`
- Subject, topic, subtopic, and question controllers, services, and routes
- `questionImport.service.js`
- `category.model.js` only if it represents question taxonomy; otherwise keep it with `current-affairs`
- `seed/category.seed.js` moves with whichever module owns `category.model.js`

### `exams`

- `test.model.js`, `testSection.model.js`, `testSubmission.model.js`, `examAttempt.model.js`
- `leaderboardSnapshot.model.js`
- `test.controller.js`, `exam.controller.js`
- `test.service.js`, `exam.service.js`
- `test.routes.js`, `exam.routes.js`

`exams` consumes questions through the `question-bank` public API rather than importing its internal files.

### `courses`

- `course.model.js`, `courseModule.model.js`
- `course.controller.js`, `adminCourse.routes.js`

Course catalogue and module composition belong here. Purchase records belong to `payments`; access grants belong to `entitlements`.

### `videos`

- `video.model.js`, `video.controller.js`, `video.service.js`, `video.routes.js`
- Video upload, signed playback URLs, and course-video lookup

Access decisions should be delegated to the `entitlements` public API instead of querying entitlement internals directly.

### `payments`

- `order.model.js`, `paymentTransaction.model.js`
- `invoice.model.js`, `invoiceSequence.model.js`
- `coupon.model.js`, `couponUsage.model.js`
- `payment.controller.js`, `payment.service.js`, `payment.routes.js`
- `razorpay.service.js`, `invoice.service.js`, `coupon.service.js`, `refund.service.js`

The Razorpay webhook remains registered before JSON parsing. Payment completion calls the `entitlements` public API to grant access.

### `entitlements`

- `userEntitlement.model.js`
- `entitlement.service.js`, `entitlementGuard.js`
- `expiryCron.js`

This module owns access state and expiry. It may query public course/video/exam APIs but must not import their internal models after boundary enforcement.

### `chat`

- `chatMessage.model.js`, `chatReport.model.js`, `moderationLog.model.js`
- `chat.controller.js`, `chatModeration.controller.js`
- `chat.service.js`, `socket.service.js`
- `chat.routes.js`, `adminChat.routes.js`
- `chat.socket.handler.js`

Socket.IO registration should be exported from `modules/chat/index.js` so `server.js` does not know the module's internal handler layout.

### `ai-assistant`

- `contentChunk.model.js`
- `vectorSearch.controller.js`, `ai.routes.js`
- `embedding.service.js`, `vectorRetrieval.service.js`
- `translation.queue.js`, `translation.queue.service.js`

Provider and connection configuration remains under `config/`. Domain orchestration belongs in this module.

### `current-affairs`

- `currentAffairs.model.js`, `currentAffairsBookmark.model.js`, `currentAffairsChunk.model.js`
- Current-affairs and bookmark controllers, services, and routes
- `currentAffairsRag.service.js`, `currentAffairsRag.queue.js`, `currentAffairsRag.worker.js`
- `adminCurrentAffairs.routes.js`
- `category.model.js` if categories are specific to current affairs

### `platform-settings`

- `platformSetting.model.js`
- `platformSetting.controller.js`, `platformSetting.service.js`, `platformSetting.routes.js`
- `aiSetting.controller.js`, `aiSetting.routes.js`

AI settings are operational configuration and belong here; AI execution belongs to `ai-assistant`.

### `shared`, `config`, and operational code

- `audit.middleware.js` -> `shared/middleware/`
- `auditLog.model.js` -> `shared/infrastructure/audit/` (or a future dedicated audit module if audit behavior grows)
- `searchHelper.js` -> `shared/utils/`
- `env.js`, `db.js`, `redis.js`, `r2.js`, and `openrouter.js` remain in `config/`
- Vector-index JSON definitions -> `config/vector-indexes/`
- `email.service.js` -> `shared/infrastructure/email/`
- `r2.service.js` -> `shared/infrastructure/storage/`
- `mongodbBackup.service.js`, `backup.service.js`, `mongodbBackup.job.js`, and `scripts/mongodbBackup.js` -> `shared/infrastructure/backup/` or a later dedicated `operations` module

Shared code must be domain-neutral. A file is not shared merely because two features import it; prefer exposing a small public API from the owning module.

## Dependency Rules

Adopt these rules before moving the first feature:

1. `app.js` and `server.js` are composition roots. They may import module public APIs.
2. A module may import its own internals, `config/`, and `shared/`.
3. Cross-module imports must go through the target module's `index.js` public API.
4. A module must never import another module's controller, route, worker, or private model directly.
5. `shared/` must not import from `modules/`.
6. `config/` must not import domain code.
7. Models keep their existing schema, model name, and collection behavior during this migration.
8. Routes keep their current paths, middleware order, status codes, and response bodies.
9. Avoid adding a global `modules/index.js`; explicit imports make dependencies visible and reduce circular imports.

Desired dependency direction:

```text
app.js / server.js
        │
        ▼
module public APIs ─────► other module public APIs
        │
        ├───────────────► shared/
        └───────────────► config/
```

## Migration Strategy

### Phase 0: Establish a Safety Baseline

- Run and record the complete test suite before moving files.
- Record all current HTTP mounts from `app.js`, including admin routes and the Razorpay webhook.
- Record Socket.IO event names, queue names, Redis prefixes, cron schedules, Mongoose model names, and environment variables.
- Add missing smoke tests for `GET /health`, bootstrapping the app, and Razorpay raw-body handling.
- Decide whether tests will be colocated in module `__tests__/` folders. This plan recommends colocation.
- Make file moves with `git mv` where practical so history remains easy to follow.

Exit criteria: the baseline is green and the externally observable contracts are documented or covered by tests.

### Phase 1: Add Architecture Scaffolding

- Create `src/modules/`, `src/shared/middleware/`, `src/shared/utils/`, and `src/shared/infrastructure/`.
- Move only clearly generic code first: audit middleware and search utilities.
- Add a short `src/modules/README.md` describing dependency and public-API rules.
- Add an import-boundary check with ESLint, dependency-cruiser, or a small repository script. Initially report violations without failing CI.
- Keep `app.js` and `server.js` as the only composition roots.

Exit criteria: the project still boots, tests pass, and new code has an agreed destination.

### Phase 2: Migrate Low-Coupling Modules

Move one module per pull request in this order:

1. `platform-settings`
2. `annotations`
3. `question-bank`
4. `exams`

For each module:

1. Move its model, service, controller, route, and related tests together.
2. Fix imports inside the module.
3. Export its router and any intentionally shared operations from `index.js`.
4. Update `app.js` to import the new router location without changing its mount path.
5. Leave compatibility re-export files at old paths only when another unmigrated module still imports them.
6. Run module tests, integration tests touching the feature, and then the full suite.
7. Remove the compatibility file as soon as its last consumer is migrated.

Exit criteria: no internal file for the completed feature remains in a top-level technical folder.

### Phase 3: Migrate Identity and Communication

Move in this order:

1. `users`
2. `auth`
3. `mentors`
4. `chat`

Create narrow public APIs for high-use symbols:

```js
// modules/users/index.js
export { User, USER_ROLES, USER_STATUS } from "./models/user.model.js";

// modules/auth/index.js
export { default as authRoutes } from "./auth.routes.js";
export { verifyToken, requireRole } from "./middleware/auth.middleware.js";

// modules/chat/index.js
export { default as chatRoutes } from "./chat.routes.js";
export { registerSocketHandlers } from "./socket.service.js";
```

Keep authentication middleware in `auth`, not `shared`, because it contains domain rules and queries users. Preserve chat socket event names and authorization behavior.

Exit criteria: HTTP authentication, admin-user operations, mentor threads, REST chat, and Socket.IO flows pass their existing tests.

### Phase 4: Migrate Learning Content

Move in this order:

1. `courses`
2. `books`
3. `videos`
4. `ai-assistant`

Move the knowledge-chunk and reading-progress queues/workers with `books`, not in a global queue or worker folder. Move translation and vector search with `ai-assistant`. Keep queue names and worker startup semantics unchanged.

At the end of this phase, change `server.js` from worker side-effect imports to explicit startup APIs where feasible:

```js
import { startBookWorkers } from "./modules/books/index.js";
import { startAiWorkers } from "./modules/ai-assistant/index.js";
```

Do not combine this with changing queue technology, payloads, concurrency, retry policies, or Redis keys.

Exit criteria: book ingestion, progress updates, uploads, playback authorization, embedding, retrieval, and background processing behave exactly as before.

### Phase 5: Migrate Commerce and Access

Move in this order:

1. `entitlements`
2. `payments`

Define explicit cross-module operations such as:

- `entitlements.grantCourseAccess(...)`
- `entitlements.assertResourceAccess(...)`
- `entitlements.expireEntitlements(...)`
- `courses.getPurchasableCourse(...)`

This is the highest-risk dependency boundary because payments currently coordinate courses, coupons, invoices, payment transactions, and entitlements. Keep it as a dedicated phase and do not refactor business rules while relocating it.

Exit criteria: order creation, payment verification, webhook processing, invoices, refunds, coupons, access grants, and expiry all pass unit and integration tests.

### Phase 6: Migrate Current Affairs

Move the complete vertical slice together:

- Public and admin routes
- Article, bookmark, category, and chunk models
- Controllers and services
- RAG queue and worker
- Related tests

This module moves late because it combines CRUD, bookmarks, categorization, vector ingestion, queues, and workers. It may use `ai-assistant` for embedding/retrieval capabilities through that module's public API.

Exit criteria: current-affairs CRUD, bookmarks, admin operations, ingestion, and RAG processing pass all tests.

### Phase 7: Remove Compatibility Layers and Enforce Boundaries

- Delete the now-empty top-level `controllers/`, `services/`, `models/`, `routes/`, `queues/`, `workers/`, `handlers/`, `jobs/`, `middleware/`, `utils/`, and `tests/` folders.
- Remove all temporary re-export shims.
- Fail CI on forbidden cross-module deep imports.
- Search for imports referencing the removed folders.
- Update contributor documentation and code-review guidance.
- Run the full suite and production-like startup smoke test.

Exit criteria: every domain file is feature-owned, boundaries are enforced, and no old-path import remains.

## Per-Module Pull Request Checklist

- [ ] Move one complete feature slice and its tests.
- [ ] Preserve route paths and middleware order.
- [ ] Preserve exported names used by unmigrated consumers.
- [ ] Preserve Mongoose model names and collection behavior.
- [ ] Preserve queue names, job payloads, Redis keys, and worker options.
- [ ] Preserve Socket.IO event names where applicable.
- [ ] Expose only required cross-module operations from `index.js`.
- [ ] Add a temporary old-path re-export only when necessary.
- [ ] Update `app.js` or `server.js` composition imports.
- [ ] Run focused tests for the module.
- [ ] Run integration tests for direct consumers.
- [ ] Run `npm test`.
- [ ] Confirm no unrelated business-rule refactor is mixed into the move.

## Verification Commands

```bash
# Complete regression suite
npm test

# Find imports still using legacy technical-layer paths
rg '(/|\.\./)(controllers|services|models|routes|queues|workers|handlers|jobs|middleware|utils)/' src

# Find cross-module deep imports; review each result and replace with public APIs
rg 'modules/[^/]+/(controllers|services|models|routes|queues|workers|handlers|jobs|middleware)/' src/modules

# Verify startup imports resolve
node --check src/app.js
node --check src/server.js
```

Also run an application startup smoke test with MongoDB and Redis available. Syntax checks alone do not execute imports or validate worker connections.

## Risks and Controls

| Risk | Control |
| --- | --- |
| Broken relative imports | Move one module at a time; use public entry points; run focused and full tests. |
| Circular dependencies between modules | Keep public APIs small; move orchestration to the caller; use dependency injection for callbacks when necessary. |
| Changed route or middleware order | Snapshot the current mount table; update only import paths in `app.js`. |
| Razorpay signature failures | Keep the webhook registration before JSON parsing and add a raw-body integration test. |
| Mongoose model recompilation or collection drift | Keep model names, schema definitions, and export shapes unchanged. |
| Workers starting twice or not starting | Centralize explicit worker startup in `server.js` and add startup smoke tests. |
| Queue incompatibility during rolling deploys | Do not change queue names, payloads, Redis keys, or retry settings during the move. |
| Large, unreviewable pull requests | Use one feature per pull request and avoid behavior refactors. |
| Long-lived compatibility shims | Mark each shim with its remaining consumers and remove it in the consumer's migration PR. |
| Tests becoming detached from ownership | Move tests with their feature and keep only true cross-feature tests under root `tests/integration/`. |

## Rollback Strategy

Each module migration must be independently revertible. A rollback should restore old imports and file locations without data migration because schemas, collections, API contracts, queues, and job payloads are intentionally unchanged.

Do not delete compatibility re-exports in the same commit that first introduces a new module path unless every consumer has already moved. This keeps rollback limited to application code and avoids coordinated deployment requirements.

## Definition of Done

- The target `src/modules/` structure owns all domain code.
- `app.js` contains composition and HTTP middleware setup, not business logic.
- `server.js` contains process startup and infrastructure wiring, not feature internals.
- Cross-module dependencies use explicit public APIs.
- No imports reference the old technical-layer directories.
- No temporary compatibility re-export remains.
- Route paths, response contracts, database behavior, queue behavior, cron schedules, and Socket.IO events are unchanged.
- Unit and integration tests pass.
- CI enforces the module-boundary rules for future changes.
