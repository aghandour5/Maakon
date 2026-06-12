# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-06-12 - Missing NaN Check Before DB Queries in Admin Endpoints
**Vulnerability:** Missing `isNaN()` validation on `Number(req.params.id)` in the `/admin/ngos/:id/verify` endpoints. Passing `NaN` directly to Drizzle ORM queries could cause unexpected exceptions.
**Learning:** Parsing path parameters with `Number()` does not throw an error for non-numeric strings, it returns `NaN`. `NaN` must be explicitly handled before executing DB operations.
**Prevention:** Always follow the pattern: extract with `Number()`, check with `isNaN(id)`, return 400 error if true, then proceed with the DB query.
