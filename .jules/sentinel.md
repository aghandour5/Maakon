# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-06-01 - Fail-Open Admin Security Configuration
**Vulnerability:** The admin IP whitelist middleware was configured to fail-open (allow all traffic) if the `ADMIN_IP_WHITELIST` environment variable was empty. This risked exposing admin endpoints if the environment variable was accidentally omitted during production deployment.
**Learning:** "Fail-open" logic is dangerous for security controls, especially for sensitive administrative functionality.
**Prevention:** Enforce a "fail-closed" posture. Throw an error during application/module startup if critical security variables (like `ADMIN_IP_WHITELIST` or `ADMIN_SUBDOMAIN`) are missing in production.
