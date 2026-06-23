# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-14 - Fail-Open Security Configurations

- Severity: High
- Vulnerability: Security configurations (`ADMIN_IP_WHITELIST` and `ADMIN_HOST_CHECK_ENABLED`) allowed fail-open bypasses via missing environment variables or hardcoded `NODE_ENV !== "production"` checks in middleware, effectively disabling them.
- Impact: In missing/misconfigured production setups or properly configured non-production environments (like staging), attackers could potentially bypass admin IP restrictions and host restrictions entirely.
- Prevention: Implement a fail-closed pattern by asserting required environment variables at module initialization time for production and removing environment-specific checks that bypass the entire middleware layer. Retain empty-checks within the middleware only to gracefully handle non-production setups.
