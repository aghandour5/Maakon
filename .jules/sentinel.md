## 2024-04-25 - Information Exposure through Zod Validation Errors
**Vulnerability:** Stringifying and exposing Zod errors (`String(parsed.error)`) in HTTP response payloads.
**Learning:** Returning raw stringified validation errors exposes internal schema structures, stack traces, and underlying details that an attacker could use to gain insight into the application's implementation and input requirements.
**Prevention:** Always return generic validation error messages (e.g. `{"error": "Validation failed"}`) instead of detailed internal exception or parser errors. Log detailed validation errors server-side if necessary without exposing them to the client.
