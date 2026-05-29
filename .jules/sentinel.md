# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-05-09 - Fail-Closed Security Configuration

**Vulnerability:** The admin router IP whitelisting logic defaulted to a "fail-open" pattern, allowing admin access from any IP address if `ADMIN_IP_WHITELIST` was left undefined or empty in production.
**Learning:** Security-sensitive environment variables, particularly those controlling access to administration functionality (like IP whitelisting and allowed hosts/subdomains), should adhere to a strict "fail-closed" pattern to prevent misconfigurations from inadvertently granting widespread access.
**Prevention:** Enforce required configuration parameters during module initialization or server startup by throwing synchronous errors (`throw new Error(...)`) when critical variables like `ADMIN_IP_WHITELIST` or `ADMIN_SUBDOMAIN` are missing in production environments.
