# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-05-27 - Fail-Closed Security Configuration

**Vulnerability:** Security-critical environment variables (`ADMIN_SUBDOMAIN` and `ADMIN_IP_WHITELIST`) used fail-open logic where missing variables would allow access or degrade security instead of blocking access in production.
**Learning:** Hardcoded fallback values or `if (empty) allow` logic can inadvertently disable critical security checks if an environment variable is omitted or misconfigured during deployment. In production, missing configurations should halt the application.
**Prevention:** Implement fail-closed patterns for security configurations by performing a hard check (e.g., throwing a module initialization error) during startup in production instead of leaving the check disabled.
