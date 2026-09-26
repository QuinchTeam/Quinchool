# API (NestJS)

- Orchestrator: `apps/web` calls here for everything. This app owns auth and the database.
- Never perform AI, RAG, or scraping logic here — delegate to `apps/ai`.
- Organized by NestJS modules under a `modules/` folder, one folder per feature/domain. Each feature folder is that feature's exclusive lib.
- File naming inside a feature folder: `feature.scope.ext` (e.g. `contract`, `controller`, `module`, `repository`, `service`, `types` scopes).
- A feature folder may have subfolders for more complex cases. No strict naming for subfolders, but files inside still follow `feature.scope.ext`.

## Tests

Tests live in a dedicated `test/` folder at the same level as `src/`. The `test/` tree mirrors the `src/` directory structure, containing only test files (no source files alongside them).
