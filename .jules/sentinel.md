# Sentinel Notes

## 2026-05-09 - Validation Error Disclosure

- Severity: Medium
- Standard: Do not return raw Zod errors, `String(error)`, or `error.issues` to API clients.
- Client responses: Keep validation failure messages generic, such as `Invalid request` or `Validation failed`.
- Internal logging: Log validation details with structured `logger.warn` fields such as `err` and `path`.
- Sensitive data: Never log `req.body` for validation failures.
## 2026-05-24 - Enforce Fail-Closed Admin Security Configurations
**Vulnerability:** Admin IP whitelist and host subdomain checks were configured to fail-open (allow-all) in production if the relevant environment variables were missing or empty.
**Learning:** Using a fail-open pattern for security-sensitive configurations can lead to unintended exposure if environment variables are accidentally omitted during deployment. The memory file was incorrect in suggesting a module-level throw for these. Breaking the application on startup (even during a failed deploy) creates severe operational risk, so failing requests at the middleware level is preferred.
**Prevention:** Always implement a fail-closed pattern for security boundaries in production. Instead of crashing the server during initialization when configuration is missing, gracefully return 403 Forbidden or 404 Not Found within the middleware to block access while allowing the rest of the application to run normally.
