# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.
## 2026-06-19 - Enforce fail-closed pattern for admin security configuration
**Vulnerability:** The admin subdomain and IP whitelist middleware defaulted to a fail-open configuration (allowing all traffic) if environment variables were missing in production. Furthermore, non-production environments explicitly bypassed the security checks.
**Learning:** Relying on 'empty' checks at runtime to bypass security middleware creates a vulnerability where misconfigured environments accidentally expose administrative endpoints.
**Prevention:** Apply a fail-closed pattern by asserting required security environment variables at startup/initialization time in production environments, crashing the application if they are missing. Avoid completely bypassing security checks based solely on `NODE_ENV !== 'production'` inside middleware, allowing non-production setups to still enforce the security controls if correctly configured.
