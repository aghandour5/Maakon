# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-06-14 - Missing NaN Validation for URL Parameters
**Vulnerability:** API routes parsing numeric URL parameters (`Number(req.params.id)`) without validating against `NaN` before querying the database.
**Learning:** `Number()` returns `NaN` for non-numeric strings. Drizzle ORM does not automatically catch or convert `NaN`, potentially leading to unexpected query failures, unhandled exceptions, or database errors.
**Prevention:** Always follow the extraction of numeric parameters with an explicit `if (isNaN(id))` check and return an appropriate 400 error if validation fails.
