# API (NestJS)

- Orchestrator: `apps/web` calls here for everything. This app owns auth and the database.
- Never perform AI, RAG, or scraping logic here — delegate to `apps/ai`.
- Organized by NestJS modules under a `modules/` folder, one folder per feature/domain. Each feature folder is that feature's exclusive lib.
- File naming inside a feature folder: `feature.scope.ext` (e.g. `contract`, `controller`, `module`, `repository`, `service`, `types` scopes).
- A feature folder may have subfolders for more complex cases. No strict naming for subfolders, but files inside still follow `feature.scope.ext`.

## API Design and Conventions

- Name routes after resources (nouns), not actions: `GET /users`, `POST /users`, `DELETE /users/:id` — never `/getUsers`, `/createUser`, `/deleteUser`. The URL identifies the resource; the HTTP method describes the action.
- Pick the method by the operation, not by what sounds right: `GET` read, `POST` create, `PUT` replace, `PATCH` partial update, `DELETE` delete.
- Return the status code that tells the client what happened. The most common ones are below; for any other case, see `docs/conventions/backend/http-status-codes.md`.
  - Success: `200` OK, `201` created, `204` success with no body.
  - Client error: `400` invalid request, `401` not authenticated, `403` authenticated but not allowed, `404` not found, `409` conflict, `422` semantically invalid, `429` too many requests.
  - Server error: `500` unexpected error, `503` temporarily unavailable.
- Keep responses predictable: success returns `{ data }`, failure returns `{ error: { code, message } }`, with optional `meta` and `links` for lists. Controllers return plain values (or `ApiResponse` for `meta`/`links`) and throw `{ code, message }`; `src/core/http/` renders the envelope. See `docs/conventions/backend/api-responses.md`.
- Put each input in its one place: path for IDs, query for search/filter/sort/pagination/fields (in that order), body for resource data, headers for auth and content type. See `docs/conventions/backend/api-requests.md`.

## Tests

Tests live in a dedicated `test/` folder at the same level as `src/`. The `test/` tree mirrors the `src/` directory structure, containing only test files (no source files alongside them).
