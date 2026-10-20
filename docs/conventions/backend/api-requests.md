# API Requests

Each piece of input has one home, so both sides know where to send and read it.

## Where input goes

| Location     | Purpose                                     | Example                     |
| ------------ | ------------------------------------------- | --------------------------- |
| Path params  | Identify a resource                         | `/users/123`                |
| Query params | Search, filter, sort, paginate, pick fields | `?status=active`            |
| Request body | Create or modify resource data              | `{ "name": "Alex" }`        |
| Headers      | Auth, content type, conditional requests    | `Authorization: Bearer ...` |

- Path params are IDs only. Nest at most one level: `/users/123/posts`, not `/users/123/posts/9/comments`.
- `GET` and `DELETE` have no body. Put their input in the path or query.
- Never put secrets or tokens in the query string. They end up in logs. Use headers.
- Body is JSON (`Content-Type: application/json`) unless it's a file upload (`multipart/form-data`).

## Query parameter order

HTTP doesn't require an order, and the backend must accept any order. When writing URLs, docs, and clients, use this order:

1. Search: `search`
2. Filters: resource fields, e.g. `status`, `role`
3. Sorting: `sortBy`, `sortOrder` (`asc` | `desc`)
4. Pagination: `page`, `pageSize` (offset) or `cursor`, `limit` (cursor)
5. Fields: `fields` (comma-separated)

```http
GET /users?search=alex&status=active&role=admin&sortBy=createdAt&sortOrder=desc&page=1&pageSize=20&fields=id,name,email
```

- Names are `camelCase`.
- Multiple values are comma-separated: `?status=active,pending`.
- Validate and cap `pageSize`/`limit` (e.g. max 100) and allow-list `sortBy` fields.

### Pagination styles

| Style  | Query              | `meta` in the response                 | Use for                                                  |
| ------ | ------------------ | -------------------------------------- | -------------------------------------------------------- |
| Offset | `page`, `pageSize` | `page`, `pageSize`, `total`            | Small lists where users jump to page N.                  |
| Cursor | `cursor`, `limit`  | `nextCursor` (`null` on the last page) | Feeds that grow while you page (transactions, messages). |

The cursor is opaque: clients pass back `meta.nextCursor` as-is and never build one. Example: `GET /finance-tracker/transactions?limit=20&cursor=eyJpZCI6...`.

## Request body property order

JSON objects are unordered, so property order must never change backend behavior. For readability, write bodies, DTOs, and examples in this order:

1. Identifiers or relationships: `userId`, `projectId`
2. Primary business fields: `title`, `description`
3. Optional configuration: `isPublic`, `priority`
4. Additional metadata: `tags`, `source`

```json
{
  "projectId": "42",
  "title": "Fix login bug",
  "description": "Magic link expires too early",
  "priority": "high",
  "isPublic": false,
  "tags": ["auth"]
}
```

- Keys are `camelCase`, dates are ISO 8601 UTC, IDs are strings. Same rules as responses.
- Don't send fields the server sets: `id`, `createdAt`, `updatedAt`.
- `PATCH` sends only the fields that change. `PUT` sends the full resource.
