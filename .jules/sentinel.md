# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-09 - Fail-Closed Security Configuration
**Vulnerability:** Admin endpoints used a fail-open pattern (allowing all traffic) if security IP/host allowlists were omitted from environment variables in production.
**Learning:** Security-sensitive configurations should crash the application on startup (fail-closed) if missing, rather than defaulting to permissive access.
**Prevention:** Throw an error during module initialization for missing critical security environment variables in production.
