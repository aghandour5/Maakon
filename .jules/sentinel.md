## 2025-01-20 - [Information Disclosure in Zod Validation Errors]
**Vulnerability:** Zod validation errors were being converted to strings (`String(parsed.error)`) and returned directly to the client in HTTP 400 responses.
**Learning:** Returning stringified Zod errors or other internal validation errors directly in HTTP responses can inadvertently leak internal schema structures or stack traces to the client. This exposes application details that an attacker could use to craft more targeted attacks.
**Prevention:** Validation errors should not be exposed to the client in detail. Return generic error messages (e.g., "Validation failed") to the client, and log the full error details internally using the structured logger (`logger.warn({ err: parsed.error })`).
