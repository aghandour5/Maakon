## 2024-03-24 - Missing Audit Log Attribution\n**Vulnerability:** Admin actions (like changing post status) were being logged to `adminActionsTable` with a hardcoded `adminId: null`.\n**Learning:** Even when routes are properly protected with authentication and authorization middleware (`requireAuth`, `requireAdmin`), audit logs must explicitly capture the identity of the actor performing the action to ensure non-repudiation and accountability.\n**Prevention:** Always use the authenticated user's ID (`req.user.id`) when recording actions in audit logs, rather than hardcoding null or generic values.

## 2024-05-27 - Remove Leaked Database Credentials and Hardcoded API Keys
**Vulnerability:** A one-off database script (`lib/db/rename.mjs`) contained a hardcoded PostgreSQL connection string, including a plain-text database password. Additionally, `supabase-admin.ts` and `supabase.ts` contained a hardcoded Supabase project URL and a placeholder Anon Key as fallbacks.
**Learning:** Developers sometimes commit temporary scripts or use hardcoded values during active development without realizing they will be permanently stored in version control, exposing sensitive credentials and application identifiers to anyone with access to the repository.
**Prevention:** Use environment variables exclusively for secrets, credentials, and API endpoints. Remove single-use scripts containing credentials before committing them. Fallback values in application code should be empty strings or fail loudly if the required environment variables are not provided.
## 2024-05-24 - Rate Limiting /feedback
**Vulnerability:** Missing rate limit on unauthenticated /feedback route
**Learning:** This route writes to DB and calls an external webhook without authentication, making it a prime target for abuse.
**Prevention:** Apply express-rate-limit middleware to vulnerable routes.

## 2025-02-12 - Information Exposure in Admin Routes
**Vulnerability:** The `/admin/users/:id` and `/admin/ngos/:id` delete routes exposed internal `err.message` in the 500 error response JSON to the client. Additionally, `console.error` was used in `admin.ts` and `feedback.ts` which is harder to aggregate securely.
**Learning:** These endpoints were using generic catch blocks to send the `err.message` property, creating a risk of disclosing database schema details, sensitive system state, or module paths when operations fail.
**Prevention:** Always sanitize API responses to return generic error messages (e.g., "Failed to delete user" instead of `err.message`). Route errors should only be fully serialized within server-side structured logging (e.g. `logger.error({ err })`).
