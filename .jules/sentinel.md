# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2024-06-24 - Fail-Closed Security for Admin Environment Variables
**Vulnerability:** Security-sensitive environment variables (`ADMIN_SUBDOMAIN`, `ADMIN_IP_WHITELIST`) had hardcoded fallback behavior (allowing all or failing open) even in production if the variables were not set. Additionally, the security middleware bypassed checks entirely for non-production environments using an environment check (`process.env.NODE_ENV !== "production"`).
**Learning:** Hardcoded bypasses and fail-open defaults for security configurations can lead to accidental exposure of administrative endpoints in production due to simple misconfiguration. Furthermore, hardcoded environment bypasses prevent testing the security control in intermediate environments like staging.
**Prevention:** Implement a 'fail-closed' initialization pattern in production. Explicitly throw an error during module load if critical security environment variables are missing when `NODE_ENV === "production"`. Rely on feature flags (e.g., `ADMIN_HOST_CHECK_ENABLED`) instead of hardcoded environment bypasses to allow testing in any environment.
