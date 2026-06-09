# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-06-09 - Fix fail-open security configuration for admin routes
**Vulnerability:** The API server previously had a fail-open implementation for `ADMIN_IP_WHITELIST`, which allowed all IP addresses to access the admin endpoints if the whitelist was accidentally empty or misconfigured. This creates a risk of unintentional broad exposure to sensitive admin functionalities.
**Learning:** Security-sensitive middleware or features should follow a fail-closed pattern in production to avoid dangerous edge cases if configuration is missing or broken. In this case, `ADMIN_IP_WHITELIST` and the admin domain checking should be strictly required and crash at initialization in production to alert developers of the misconfiguration.
**Prevention:** Implementing startup validation (i.e. top-level `throw new Error`) is a strong mechanism to enforce required security environment configurations, preventing fail-open access holes from propagating to runtime handlers. Local environments should still be exempt if appropriate for developer workflows.
