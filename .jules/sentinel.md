## 2025-02-28 - Stringified Validation Errors Exposing Internals
**Vulnerability:** Zod validation structures (`String(parsed.error)`) were being leaked in HTTP 400 bad request responses.
**Learning:** Returning stringified validation objects or stack traces reveals internal schema structures or application context directly to the client, providing attackers with detailed error insights.
**Prevention:** Always log validation errors internally using structured logging (`logger.warn`) and return generic error messages to clients (e.g., "Invalid request format") to prevent information disclosure.
