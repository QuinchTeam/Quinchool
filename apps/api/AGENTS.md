# Conventions and Practice

- Orchestrator: `apps/web` calls here for everything. This app owns auth and the database.
- Never perform AI, ML, RAG, or Scraping logic here — delegate it to `apps/ai`.
- Organized by NestJS modules under a `modules/` folder, one folder per feature/domain. Each feature folder is that feature's exclusive lib.
- File naming inside a feature folder: `feature.scope.ext` (e.g. `contract`, `controller`, `module`, `repository`, `service`, `types` scopes).
- A feature folder may have subfolders for more complex cases. No strict naming for subfolders, but files inside still follow `feature.scope.ext`.
- Name routes after resources (nouns), not actions: `GET /users`, `POST /users`, `DELETE /users/:id` — never `/getUsers`, `/createUser`, `/deleteUser`. The URL identifies the resource; the HTTP method describes the action.
- Pick the method by the operation, not by what sounds right: `GET` read, `POST` create, `PUT` replace, `PATCH` partial update, `DELETE` delete.
- Follow [HTTP status code conventions](../../docs/conventions/backend/http-status-codes.md).
- Follow [API response conventions](../../docs/conventions/backend/api-responses.md).
- Follow [API request conventions](../../docs/conventions/backend/api-requests.md).
- Long-running work (e.g. job scans) runs as a background task in this app: claim a status row, start the work without awaiting it, return `202`, and let clients poll the status from the database. No queue yet; see `modules/jobs-scraper`.
- Files go through `shared/clients/storage/storage-client.ts` (S3 API: R2 in production, Garage locally). Keep the bucket private and serve files through our own routes, as `modules/profile` does for avatars.

## Adding Tests

Tests live in a dedicated `test/` folder at the same level as `src/`. The `test/` tree mirrors the `src/` directory structure, containing only test files (no source files alongside them).
