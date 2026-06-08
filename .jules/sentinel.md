# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-06-08 - Enforce fail-closed security configurations
**Vulnerability:** Admin endpoints allowed 'fail-open' access when security environment variables (ADMIN_SUBDOMAIN, ADMIN_IP_WHITELIST) were missing.
**Learning:** Security controls should fail securely (fail-closed). Defaulting to 'allow-all' when configuration is missing undermines defense-in-depth and can silently expose administrative interfaces.
**Prevention:** Implement top-level validation during module initialization to crash the application if required security configurations are missing, rather than handling missing config gracefully at runtime.
