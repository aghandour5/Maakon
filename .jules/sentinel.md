# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-05-18 - Admin Security Config Fail-Open Vulnerability
**Vulnerability:** Missing security-sensitive environment variables (`ADMIN_SUBDOMAIN` and `ADMIN_IP_WHITELIST`) resulted in a fail-open state for admin routes.
**Learning:** Security-critical configuration should default to a fail-closed pattern in production to prevent unintended access if environment variables are missing.
**Prevention:** Throw an error during module initialization when essential security-related environment variables are absent in the production environment.
