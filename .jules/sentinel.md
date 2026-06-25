# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-09 - Fail-Closed Security Configuration
**Vulnerability:** Admin IP whitelist and subdomain checks were failing open in production by bypassing middleware or allowing empty configurations.
**Learning:** Relying on middleware empty-checks to bypass security rules can lead to fail-open scenarios in production if environment variables are accidentally omitted. Bypassing middleware entirely with NODE_ENV checks disables the security control in non-production environments like staging.
**Prevention:** Enforce a fail-closed pattern by adding top-level module initialization checks that throw errors in production if required security variables are missing. Retain empty-check fallbacks in middleware for local development to avoid breaking the app.
