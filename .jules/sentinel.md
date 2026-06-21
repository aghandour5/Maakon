# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-09 - Fail-Closed Admin Configuration
**Vulnerability:** Admin endpoints could fail-open if critical environment variables (`ADMIN_SUBDOMAIN`, `ADMIN_IP_WHITELIST`) were missing in production, falling back to permissive defaults.
**Learning:** Relying purely on runtime checks for module configuration allows misconfigured instances to boot, risking exposure of sensitive moderation APIs.
**Prevention:** Implement initialization-time fail-closed assertions that throw errors and halt process startup if critical security environment variables are missing.
