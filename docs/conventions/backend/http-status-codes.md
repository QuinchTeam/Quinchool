# HTTP Status Codes

Pick the code that tells the client what happened. Full list: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status

## 2xx: Success

| Code                | Use when                                                                       |
| ------------------- | ------------------------------------------------------------------------------ |
| 200 OK              | Request succeeded and returns a body (GET, PATCH, PUT).                        |
| 201 Created         | A new resource was created (POST). Return the resource.                        |
| 202 Accepted        | Work was queued but not finished yet (async jobs, e.g. scraping in `apps/ai`). |
| 204 No Content      | Success with nothing to return (DELETE, or an update with no body).            |
| 206 Partial Content | Returning part of a resource for a `Range` request (file/video streaming).     |

## 3xx: Redirection

| Code                   | Use when                                                        |
| ---------------------- | --------------------------------------------------------------- |
| 301 Moved Permanently  | URL changed for good. Browsers may switch POST to GET.          |
| 302 Found              | Temporary redirect (e.g. OAuth login flow).                     |
| 303 See Other          | After a POST, send the client to GET a different URL.           |
| 304 Not Modified       | Client's cached copy is still valid (`ETag` / `If-None-Match`). |
| 307 Temporary Redirect | Temporary redirect that must keep the same method.              |
| 308 Permanent Redirect | Permanent redirect that must keep the same method.              |

## 4xx: Client error

| Code                                | Use when                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------ |
| 400 Bad Request                     | Malformed request: bad JSON, missing fields, wrong types.                |
| 401 Unauthorized                    | Not logged in, or token is missing, invalid, or expired.                 |
| 403 Forbidden                       | Logged in, but not allowed to do this.                                   |
| 404 Not Found                       | Resource doesn't exist. Also fine to hide a resource the user can't see. |
| 405 Method Not Allowed              | Route exists, but not for this method.                                   |
| 406 Not Acceptable                  | Can't return the format the client asked for in `Accept`.                |
| 408 Request Timeout                 | Client took too long to send the request.                                |
| 409 Conflict                        | Clashes with current state: duplicate email, version mismatch.           |
| 410 Gone                            | Resource was deleted permanently and won't come back.                    |
| 412 Precondition Failed             | `If-Match` / `If-Unmodified-Since` check failed (stale update).          |
| 413 Content Too Large               | Upload or body is over the size limit.                                   |
| 414 URI Too Long                    | URL or query string is too long.                                         |
| 415 Unsupported Media Type          | Wrong `Content-Type` (e.g. sent form data where JSON is expected).       |
| 422 Unprocessable Content           | Well-formed but fails business rules (end date before start date).       |
| 428 Precondition Required           | Update must be conditional to prevent lost updates.                      |
| 429 Too Many Requests               | Rate limited. Send `Retry-After`.                                        |
| 431 Request Header Fields Too Large | Headers (often cookies) are too big.                                     |
| 451 Unavailable For Legal Reasons   | Blocked for legal reasons.                                               |

## 5xx: Server error

| Code                      | Use when                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------- |
| 500 Internal Server Error | Unexpected bug. Default when nothing more specific fits.                              |
| 501 Not Implemented       | Method or feature isn't supported yet.                                                |
| 502 Bad Gateway           | An upstream service (e.g. `apps/ai`, a third-party API) returned an invalid response. |
| 503 Service Unavailable   | Down for maintenance or overloaded. Send `Retry-After`.                               |
| 504 Gateway Timeout       | An upstream service didn't respond in time.                                           |

## Rules of thumb

- `400` vs `422`: can't parse or validate the shape → `400`; valid shape but breaks a rule → `422`.
- `401` vs `403`: who are you? → `401`; I know you, but no → `403`.
- `404` vs `410`: might exist later → `404`; gone forever → `410`.
- Never return `200` with an error in the body.
- Never use `5xx` for client mistakes.

Skipped (WebDAV, protocol-level, or joke codes): 100, 101, 102, 103, 203, 205, 207, 208, 226, 300, 305, 306, 402, 407, 411, 416, 417, 418, 421, 423, 424, 425, 426, 505, 506, 507, 508, 510, 511.
