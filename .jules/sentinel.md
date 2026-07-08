# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-05-24 - Missing Input Validation on Database Operations
**Vulnerability:** Missing `isNaN` check after parsing route parameters with `Number(req.params.id)` before executing database queries with Drizzle ORM.
**Learning:** Drizzle ORM does not natively prevent `NaN` from being passed in `.where()` clauses for numeric columns, which can lead to unhandled exception crashes or unexpected database query behaviour.
**Prevention:** Always validate extracted numeric parameters with `isNaN()` before passing them to database operations. Reject requests with a 400 Bad Request if the parameter is invalid.
