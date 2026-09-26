# Module Boundaries

Each folder under `modules/` owns one business capability and may contain its
routes, controllers, services, models, jobs, queues, workers, handlers, and
tests.

## Import rules

1. `app.js` and `server.js` are the application composition roots.
2. Cross-module domain imports must use the target module's `index.js`.
   Composition roots import HTTP routers through `routes/index.js` so importing
   a domain API never starts route, queue, or worker side effects.
3. A module may import its own internal files, `config/`, and `shared/`.
4. `shared/` and `config/` must not import feature modules.
5. Do not expose controllers or private helpers from a module unless another
   feature has a demonstrated need for that operation.
6. Preserve HTTP paths, middleware order, model names, queue names, and event
   names when reorganizing a module.
