# FastAPI architecture

The service is stateless: it accepts JSON, performs scraping and AI work, and
returns JSON. Database access and persistence do not belong here.

## Directories

- `routes` = HTTP/API boundary. Define FastAPI routers, request handling,
  dependencies, status codes, headers, and response/error mapping. Handlers
  should call a service and remain thin.
- `services` = application use cases and orchestration. Coordinate workflows
  such as scrape, extract, classify, and assemble the response.
- `validations` = validation and API data contracts. Keep Pydantic models,
  enums, field constraints, aliases, and validators here.
- `lib` = application-specific domain capabilities used by services. Organize
  it by owning domain or capability, such as `llm/`, `scraping/`, and
  `jobs_scraper/`; keep implementation details beside that owner.
- `core` = app-wide infrastructure and configuration, such as settings,
  logging, and exceptions shared across layers. Do not put feature workflows
  here.

## Dependency direction

`routes -> services -> lib`

`validations` and `core` support those layers but must not depend on routes.
`lib` must not import routes or services. Avoid controller layers, forwarding
wrappers, database abstractions, and deep helper chains.

Create `lib/shared/` only for genuinely domain-agnostic reusable code that
cannot reasonably live in an existing capability. Do not create a generic
`utils/` folder.
