# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-06-02 - Enforce Fail-Closed for Security Variables
**Vulnerability:** Security-critical environment variables (e.g. `ADMIN_SUBDOMAIN`, `ADMIN_IP_WHITELIST`) lacked a top-level fail-closed check, potentially allowing silent fail-open behavior if variables were misconfigured or missing in production.
**Learning:** Relying on default empty string fallbacks for security restrictions can inadvertently grant unauthorized access if the production environment isn't strictly configured.
**Prevention:** Always implement a fail-closed pattern (e.g. `throw new Error`) during module initialization for critical security environment variables when running in production.
