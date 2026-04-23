## 2024-05-24 - Do not leak internal Zod error strings
**Vulnerability:** Leaking internal schema structures and validation details via `String(parsed.error)` in HTTP response bodies.
**Learning:** Returning stringified Zod errors directly to the client can assist an attacker in probing the API by exposing internal structures and expected data.
**Prevention:** Avoid returning detailed validation errors in the response payload. Instead, securely log the detailed errors internally on the server (e.g., using `logger.warn`) and return a generic error message to the client.
