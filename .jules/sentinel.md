## 2024-05-01 - Information disclosure via Zod validation errors
**Vulnerability:** Zod validation errors were stringified and exposed directly to the client in HTTP 400 response bodies (`details: String(parsed.error)`).
**Learning:** Returning `String(parsed.error)` directly in HTTP responses for validation failures can inadvertently leak internal schema structures, data boundaries, or stack traces to the client.
**Prevention:** Avoid stringifying internal validation errors for the client response. Return generic error messages to the client and log the full error context internally using the structured logger.
