# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.

## 2026-06-11 - Enforce Fail-Closed Admin Security
**Vulnerability:** Admin security middleware had fail-open fallbacks and disabled checks outside of production environments, reducing protection when configured in staging/QA and risking accidental configuration misses in production.
**Learning:** Security controls like IP whitelists and admin subdomain checks must enforce a fail-closed pattern.
**Prevention:** For required security configurations in production, throw initialization errors during module setup if they are missing. Avoid completely bypassing security checks based solely on `NODE_ENV` as it leaves non-production environments unnecessarily vulnerable even when correctly configured.
