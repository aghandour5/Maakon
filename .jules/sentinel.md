## 2026-04-24 - Prevent Zod validation error stringification
**Vulnerability:** Information Disclosure via Zod Error Stringification
**Learning:** Returning `String(parsed.error)` directly to clients can inadvertently leak internal schema definitions and stack traces in error responses.
**Prevention:** Always catch validation errors, log the details internally using `logger.warn({ err })`, and return a generic validation failure message to the client.
