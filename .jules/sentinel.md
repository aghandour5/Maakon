# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-05-15 - Fail-Closed for Admin Configuration
**Vulnerability:** Admin IP whitelist fails open (allows all traffic) if `ADMIN_IP_WHITELIST` environment variable is not set. Similarly, `ADMIN_SUBDOMAIN` doesn't enforce strict failure at initialization.
**Learning:** Security-sensitive environment variables should fail-closed. If critical configurations like admin IP whitelists are missing in production, the application should refuse to start to prevent inadvertent exposure of administrative interfaces.
**Prevention:** Implement initialization checks that throw errors when required security configurations are absent, enforcing a fail-closed posture for administrative access controls.
