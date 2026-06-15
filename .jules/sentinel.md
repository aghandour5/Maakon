# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-14 - Fail-Closed Configuration Pattern
**Vulnerability:** Admin security controls (IP whitelist and subdomain check) would fail open if the required environment variables (`ADMIN_SUBDOMAIN`, `ADMIN_IP_WHITELIST`) were accidentally omitted in the production environment.
**Learning:** Middleware alone isn't sufficient for security configurations; if variables are missing, conditional checks inside middleware (e.g., `ADMIN_IP_WHITELIST.length === 0`) might inadvertently allow all requests (fail-open) rather than blocking them.
**Prevention:** Implement a top-level module check that explicitly throws an initialization error (`throw new Error(...)`) in production when critical security configuration variables are missing. This crashes the server before it can accept traffic, enforcing a strict fail-closed pattern without needing to evaluate fallbacks on every incoming request.
