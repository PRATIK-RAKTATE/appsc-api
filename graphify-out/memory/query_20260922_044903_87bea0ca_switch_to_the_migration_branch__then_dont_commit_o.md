---
type: "query"
date: "2026-09-22T04:49:03.871634+00:00"
question: "switch to the migration branch (then dont commit or push code) and execute the migration-plan.md"
contributor: "graphify"
outcome: "useful"
source_nodes: ["app.js", "auth.middleware.js", "payment.controller.js", "book.service.js"]
---

# Q: switch to the migration branch (then dont commit or push code) and execute the migration-plan.md

## Answer

Expanded from the repository graph vocabulary via [module, routes, controller, service, model, worker, queue, auth, payment, entitlement, chat, book]. Used the dependency map to preserve the app composition, auth middleware, payment-entitlement-course dependencies, chat sockets, and book/current-affairs workers while migrating horizontal layers into feature modules. Added narrow domain index APIs, route composition entry points, and an automated boundary check. The full test suite passes.

## Outcome

- Signal: useful

## Source Nodes

- app.js
- auth.middleware.js
- payment.controller.js
- book.service.js