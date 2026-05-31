# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2025-02-24 - Enforce fail-closed pattern for security-sensitive configurations
**Vulnerability:** Admin endpoints previously implemented a "fail-open" default in `adminSecurity.ts` which would allow access from any IP if `ADMIN_IP_WHITELIST` or `ADMIN_SUBDOMAIN` environment variables were not configured. This could unintentionally expose the admin interface in production if the configuration wasn't meticulously set.
**Learning:** Security-critical routing components must proactively crash (fail-closed) during server startup if their required environment variables are absent. This avoids silent bypass scenarios in production due to misconfiguration.
**Prevention:** Always implement explicit module-level `throw new Error(...)` checks when dealing with critical variables like `ADMIN_IP_WHITELIST` and `ADMIN_SUBDOMAIN` before enabling the server to run. Remove runtime fallback logic that bypasses security checks.
