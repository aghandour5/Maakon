# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-10 - Fail-Closed Security Configuration
**Vulnerability:** A fail-open logic was used for security-sensitive configurations like IP whitelisting for admin endpoints, falling back to allowing all access if environment variables were missing.
**Learning:** Fallbacks that lower security posture mask missing configurations during deployment, potentially exposing admin endpoints to unauthorized access indefinitely.
**Prevention:** Always implement a 'fail-closed' pattern for core security configurations. If a critical security variable is missing, explicitly throw an error during application initialization/startup rather than gracefully degrading security posture at runtime.
