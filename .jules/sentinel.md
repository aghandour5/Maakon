## 2025-05-02 - Information Disclosure via Zod Errors
**Vulnerability:** Zod validation errors were being stringified and returned directly in HTTP 400 response bodies (`details: String(parsed.error)`).
**Learning:** Returning `String(parsed.error)` or `String(body.error)` directly in HTTP responses for validation failures can inadvertently leak internal schema structures, keys, or stack traces to the client.
**Prevention:** Never expose internal error details in HTTP error responses. Log the full error internally using the structured logger (`logger.warn({ err: parsed.error }, ...)`), and return generic error messages to the client (e.g., `res.status(400).json({ error: "Validation failed" })`).
