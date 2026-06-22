# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-06-22 - Missing Number Validation on Admin NGO Verification Endpoints
**Vulnerability:** The `/admin/ngos/:id/verify` PATCH and DELETE endpoints cast `req.params.id` to a `Number` but failed to verify if the result was `NaN` before passing it to database queries.
**Learning:** `Number("invalid")` returns `NaN`. When Drizzle ORM receives `NaN` for a numeric column type, it can cause unexpected query issues, database type errors, or application crashes that bubble up as unhandled exceptions.
**Prevention:** Always validate that parsed numeric path parameters using `isNaN(id)` before passing them into downstream database operations. Implement centralized param parsing (like Zod) or explicitly check `!isNaN(id)` immediately after conversion.
