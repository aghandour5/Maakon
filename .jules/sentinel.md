# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-06-26 - Fail-Closed Environment Variable Checks
**Vulnerability:** Bypassing security middleware via `process.env.NODE_ENV !== "production"` effectively disabled security controls (like admin subdomain checks) in non-production environments (e.g., staging or QA) where they should have still applied.
**Learning:** When enforcing a fail-closed pattern for security-sensitive configurations, the top-level initialization check should throw an error to crash production startup if the config is missing. The middleware should keep empty-check fallbacks for local dev without explicitly short-circuiting all non-production modes.
**Prevention:** Always enforce fail-closed checks at module startup for required environment variables, and avoid adding redundant environment bypass checks in middleware routines.
