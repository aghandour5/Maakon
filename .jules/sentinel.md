## 2025-04-28 - Information Disclosure via Zod Error Stringification
**Vulnerability:** API endpoints were returning raw stringified Zod validation errors to clients in 400 Bad Request responses (e.g., `details: String(parsed.error)`).
**Learning:** Stringifying Zod validation errors can inadvertently leak internal schema structures and potentially internal logic details to clients. Information disclosure should be prevented by returning generic error messages in HTTP responses, relying on internal structured logs for detailed error contexts.
**Prevention:** Avoid stringifying `.error` objects from validation schemas (like Zod) directly into HTTP responses. Log full errors server-side securely while returning only safe, generic messages.
