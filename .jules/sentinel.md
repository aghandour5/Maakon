# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-23 - Fail-Closed Configuration Missing

**Vulnerability:** Admin security configurations (like `ADMIN_SUBDOMAIN` and `ADMIN_IP_WHITELIST`) defaulted to fail-open when environment variables were absent.
**Learning:** Security configurations must enforce a fail-closed pattern to avoid accidentally exposing sensitive routes (like the admin panel) if the infrastructure deployment misconfigures environment variables.
**Prevention:** Always implement explicit initialization checks that crash the server/module on startup (e.g., throwing an `Error`) if required security configurations are missing in production. Do not implement fallback "allow-all" mechanisms in production contexts.
