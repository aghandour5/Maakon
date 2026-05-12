# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-05-24 - Enforce fail-closed for admin environment configurations
**Vulnerability:** The application was failing open (using an empty string as fallback) when the security-sensitive `ADMIN_SUBDOMAIN` environment variable was missing. This could lead to a situation where the admin subdomain check is silently disabled in production, potentially exposing the admin panel if the whitelist is also empty or bypassed.
**Learning:** For security-sensitive configurations, such as domains for admin endpoints, it's safer to fail-closed and prevent the application from starting entirely if the required variables are missing, rather than defaulting to an insecure state.
**Prevention:** Always implement fail-closed checks for critical security environment variables (like authentication keys, admin subdomains, or CSRF secrets) during module initialization or application startup to ensure the system does not run in a degraded security state.
