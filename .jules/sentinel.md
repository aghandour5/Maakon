## 2024-03-24 - Missing Audit Log Attribution\n**Vulnerability:** Admin actions (like changing post status) were being logged to `adminActionsTable` with a hardcoded `adminId: null`.\n**Learning:** Even when routes are properly protected with authentication and authorization middleware (`requireAuth`, `requireAdmin`), audit logs must explicitly capture the identity of the actor performing the action to ensure non-repudiation and accountability.\n**Prevention:** Always use the authenticated user's ID (`req.user.id`) when recording actions in audit logs, rather than hardcoding null or generic values.

## 2024-05-27 - Remove Leaked Database Credentials and Hardcoded API Keys
**Vulnerability:** A one-off database script (`lib/db/rename.mjs`) contained a hardcoded PostgreSQL connection string, including a plain-text database password. Additionally, `supabase-admin.ts` and `supabase.ts` contained a hardcoded Supabase project URL and a placeholder Anon Key as fallbacks.
**Learning:** Developers sometimes commit temporary scripts or use hardcoded values during active development without realizing they will be permanently stored in version control, exposing sensitive credentials and application identifiers to anyone with access to the repository.
**Prevention:** Use environment variables exclusively for secrets, credentials, and API endpoints. Remove single-use scripts containing credentials before committing them. Fallback values in application code should be empty strings or fail loudly if the required environment variables are not provided.
## 2024-05-24 - Rate Limiting /feedback
**Vulnerability:** Missing rate limit on unauthenticated /feedback route
**Learning:** This route writes to DB and calls an external webhook without authentication, making it a prime target for abuse.
**Prevention:** Apply express-rate-limit middleware to vulnerable routes.
## 2025-02-17 - Prevent Information Disclosure in Admin and Feedback APIs
**Vulnerability:** The application was exposing `err.message` in HTTP 500 error responses in admin API endpoints and using plain `console.error()` which bypasses structured logging formats, posing risks of stack trace leakage and poor log centralization.
**Learning:** Returning unhandled exception messages to the client risks leaking internal system details, path structures, or database queries to users, increasing the attack surface.
**Prevention:** Always catch exceptions and return generic, safe messages like 'Internal server error'. Log the full detailed error securely server-side using the central structured `logger` object instead of `console.error`.
