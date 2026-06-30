# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-10 - Unhandled NaN from route parameters
**Vulnerability:** Extracted numeric identifiers (e.g. `Number(req.params.id)`) were passed directly to database queries without verifying they were valid numbers.
**Learning:** If a non-numeric string is passed, `Number()` returns `NaN`. Passing `NaN` directly into the database query can lead to unexpected unhandled exceptions or querying errors.
**Prevention:** Always validate extracted numbers with `isNaN()` (or use strongly typed parsers like Zod, e.g. `z.coerce.number()`) before executing operations or queries on them.
