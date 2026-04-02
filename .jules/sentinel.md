## 2024-03-24 - Missing Audit Log Attribution
**Vulnerability:** Admin actions (like changing post status) were being logged to `adminActionsTable` with a hardcoded `adminId: null`.
**Learning:** Even when routes are properly protected with authentication and authorization middleware (`requireAuth`, `requireAdmin`), audit logs must explicitly capture the identity of the actor performing the action to ensure non-repudiation and accountability.
**Prevention:** Always use the authenticated user's ID (`req.user.id`) when recording actions in audit logs, rather than hardcoding null or generic values.

## 2024-05-27 - Remove Leaked Database Credentials and Hardcoded API Keys
**Vulnerability:** A one-off database script (`lib/db/rename.mjs`) contained a hardcoded PostgreSQL connection string, including a plain-text database password. Additionally, `supabase-admin.ts` and `supabase.ts` contained a hardcoded Supabase project URL and a placeholder Anon Key as fallbacks.
**Learning:** Developers sometimes commit temporary scripts or use hardcoded values during active development without realizing they will be permanently stored in version control, exposing sensitive credentials and application identifiers to anyone with access to the repository.
**Prevention:** Use environment variables exclusively for secrets, credentials, and API endpoints. Remove single-use scripts containing credentials before committing them. Fallback values in application code should be empty strings or fail loudly if the required environment variables are not provided.

## 2025-04-02 - Secure Error Messages and Stop Information Leakage
**Vulnerability:** Internal error details, specifically `err.message`, were being exposed in HTTP 500 error responses in admin routes (e.g., `/admin/users/:id`, `/admin/ngos/:id`). Also `console.error` and `console.log` were being used instead of structured logging.
**Learning:** Returning internal error strings to the client can inadvertently leak stack traces, database schema details, or other sensitive backend information that could be useful to an attacker.
**Prevention:** Always return generic error messages (e.g., "Internal server error", "Failed to delete user") to the client. Log the full `err` object internally using a structured logger (like `pino-http`'s `logger`) so debugging information is preserved securely on the server side without being exposed over the network.
