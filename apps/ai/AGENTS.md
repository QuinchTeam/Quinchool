# Conventions and Practice

- Owns all LLM, RAG, and scraping logic. Only `apps/api` calls this app — it never calls out to `apps/web` or `apps/api`.
- Organized by modules, mirroring the `apps/api` (NestJS) convention: one folder per feature/domain, same `feature.scope.ext` file naming, optional subfolders for complex cases.

## Adding Tests

- Tests live in a dedicated `tests/` folder at the same level as the app source, mirroring the source directory structure (including `lib/`, not just `modules/`) — no flat test files directly inside `tests/`.
- Test files must start with `test_` (pytest/unittest discovery requirement — `name.test.py` will not be discovered). Name them `test_<feature>_<scope>.py` (e.g. `test_chatbot_service.py`), matching the actual source file(s) it imports and exercises — not the folder it happens to sit near. If a test touches multiple source files, put it under the module it primarily exercises and split it once it stops being about one thing.
- Every package directory under `tests/` needs an `__init__.py`, mirroring `app/`, so nested test modules don't collide with the real `app` package during discovery.
