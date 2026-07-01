# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.
## 2026-05-10 - Unvalidated Route Parameter Parsing

**Vulnerability:** Converting string route parameters to numbers using `Number()` (e.g., `Number(req.params.id)`) without subsequent validation can result in `NaN` if the input is not a valid number. Passing `NaN` into ORM queries or database operations can lead to unhandled exceptions or unexpected query behavior.
**Learning:** Found instances where `isNaN()` checks were missing after `Number(req.params.id)` on sensitive admin endpoints.
**Prevention:** Always validate numeric conversions of user input using `isNaN()` and return a `400 Bad Request` before passing the value to downstream systems or database queries.
