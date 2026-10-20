# API Responses

Every response uses the same envelope, so clients always know the shape to expect.

## Top-level keys

| Key     | When     | Contains                                                                   |
| ------- | -------- | -------------------------------------------------------------------------- |
| `data`  | Success  | The resource (object) or resources (array).                                |
| `error` | Failure  | `code`, `message`, optional `details`.                                     |
| `meta`  | Optional | Info about the response, not the resource: pagination, totals, request id. |
| `links` | Optional | URLs for related navigation: `self`, `next`, `prev`, `first`, `last`.      |

- A response has either `data` or `error`, never both.
- `204 No Content` has no body at all.
- Add `meta` and `links` only when they carry something (usually lists).

## Single resource

```json
{
  "data": { "id": "42", "name": "Alex", "email": "alex@example.com" }
}
```

## List

```json
{
  "data": [
    { "id": "42", "name": "Alex" },
    { "id": "43", "name": "Sam" }
  ],
  "meta": { "page": 2, "pageSize": 20, "total": 134 },
  "links": {
    "self": "/users?page=2",
    "next": "/users?page=3",
    "prev": "/users?page=1"
  }
}
```

Cursor-paginated lists carry the next cursor instead:

```json
{
  "data": [{ "id": "42", "amount": "120.00" }],
  "meta": { "nextCursor": "eyJpZCI6IjQyIn0" }
}
```

- Lists always return `data` as an array, even when empty (`[]`), never `null`.
- Omit `next` on the last page and `prev` on the first.
- See [api-requests.md](./api-requests.md#pagination-styles) for offset vs cursor.

## In `apps/api`

- Controllers return plain values. `ResponseInterceptor` (`src/core/http/response.interceptor.ts`) wraps them in `{ data }`.
- To add `meta` or `links`, return `new ApiResponse(data, meta, links)` from `src/core/http/api-response.ts`.
- Throw Nest exceptions with `{ code, message }`, e.g. `new NotFoundException({ code: "CHAT_NOT_FOUND", message: "Chat not found" })`. `ApiExceptionFilter` (`src/core/http/exception.filter.ts`) renders the `{ error }` body. An exception with no code gets one from its status (`NOT_FOUND`).
- `ZodValidationPipe` returns `400 VALIDATION_FAILED` with one `details` entry per issue.
- Errors from `apps/ai` come through as `AI_<CODE>` (e.g. `AI_RATE_LIMIT`), keeping the AI service's status and message.

## In `apps/web`

- Read responses with `readApiData` or `readApiEnvelope` from `src/lib/api.ts`. A failed request throws `ApiError`, which has `status`, `code`, and `details`.

## Error

```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Invalid email address"
  }
}
```

Validation errors with several fields add `details`:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request has invalid fields",
    "details": [
      {
        "field": "email",
        "code": "INVALID_EMAIL",
        "message": "Invalid email address"
      },
      { "field": "name", "code": "REQUIRED", "message": "Name is required" }
    ]
  }
}
```

- `code`: stable `UPPER_SNAKE_CASE` string clients can branch on. Never change it once shipped.
- `message`: human-readable, safe to show users. No stack traces or internal details.
- The HTTP status still carries the outcome. See [http-status-codes.md](./http-status-codes.md).

## Rules

- Keys are `camelCase`.
- Dates are ISO 8601 strings in UTC: `"2026-10-17T07:30:00Z"`.
- IDs are strings.
- Don't wrap data in extra layers (`data.user.profile`) unless the resource itself is nested.
