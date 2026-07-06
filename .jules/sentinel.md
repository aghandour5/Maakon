# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-07-06 - Missing NaN Validation on Numeric Route Parameters
**Vulnerability:** The `/admin/ngos/:id/verify` PATCH and DELETE routes were extracting `id` as `Number(req.params.id)` but failed to validate if the result was `NaN` before passing it to Drizzle ORM queries.
**Learning:** In Javascript/Typescript, `Number("invalid")` evaluates to `NaN`. Passing `NaN` directly to a database ORM like Drizzle without validation can cause unhandled exceptions and potentially unexpected query behavior or error detail leakage.
**Prevention:** Always validate numeric route parameters explicitly using `isNaN()` after parsing, and before executing any database operations.
