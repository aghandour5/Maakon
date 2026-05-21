# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-21 - Fail-Closed Security Configuration
**Vulnerability:** Admin IP whitelist failed open when unconfigured (empty string), which could expose the admin dashboard if the environment variable was missing.
**Learning:** Relying on 'fail-open' logic for security-sensitive configurations like IP whitelisting creates a severe risk of accidental exposure in production environments.
**Prevention:** Always implement a 'fail-closed' pattern for critical security environment variables by throwing an Error during module initialization or startup when they are not configured.
