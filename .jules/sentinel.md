# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-14 - Missing Fail-Closed Environment Variable Initialization
**Vulnerability:** Security-sensitive environment variables (e.g. ADMIN_IP_WHITELIST, ADMIN_SUBDOMAIN) defaulted to failing open in production if unconfigured, allowing unauthorized access.
**Learning:** Security configurations should explicitly enforce fail-closed behavior on startup to prevent misconfigurations from silently exposing administrative or sensitive interfaces.
**Prevention:** In production, explicitly check that critical environment variables are correctly configured during module initialization and throw a fatal error instead of defaulting to a permissive state.
