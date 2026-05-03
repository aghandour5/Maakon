## 2024-05-01 - Avoid Stringifying Zod Errors
**Vulnerability:** Stringifying Zod validation errors (e.g. `String(parsed.error)` or `String(body.error)`) and returning them in API responses.
**Learning:** Returning stringified Zod errors directly to the client can inadvertently expose internal schema structures, stack traces, and application internals to potential attackers, which violates secure coding practices.
**Prevention:** Never return the raw `String(error)` object. Return generic error messages or format validation errors in a secure, structured way that doesn't leak internal details, and use structured logging for debugging.
