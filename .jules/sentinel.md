# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-09 - Missing Input Validation for DB Queries

**Vulnerability:** Found missing input validation for numeric URL parameters (`req.params.id`) in NGO verification endpoints (`/admin/ngos/:id/verify`) before passing the parsed integer to database queries.
**Learning:** Extracting an ID from a string using `Number()` can result in `NaN` if the input is not numeric. When passed to a database ORM like Drizzle, `NaN` can cause unexpected query errors or crash the request handler.
**Prevention:** Always validate numeric parameters extracted from user input (e.g., URL params or query strings) with an `isNaN(id)` check and return a 400 Bad Request error before performing database operations.
