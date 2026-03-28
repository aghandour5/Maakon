## 2024-03-24 - Missing Audit Log Attribution\n**Vulnerability:** Admin actions (like changing post status) were being logged to `adminActionsTable` with a hardcoded `adminId: null`.\n**Learning:** Even when routes are properly protected with authentication and authorization middleware (`requireAuth`, `requireAdmin`), audit logs must explicitly capture the identity of the actor performing the action to ensure non-repudiation and accountability.\n**Prevention:** Always use the authenticated user's ID (`req.user.id`) when recording actions in audit logs, rather than hardcoding null or generic values.

## 2024-05-27 - Remove Leaked Database Credentials and Hardcoded API Keys
**Vulnerability:** A one-off database script (`lib/db/rename.mjs`) contained a hardcoded PostgreSQL connection string, including a plain-text database password. Additionally, `supabase-admin.ts` and `supabase.ts` contained a hardcoded Supabase project URL and a placeholder Anon Key as fallbacks.
**Learning:** Developers sometimes commit temporary scripts or use hardcoded values during active development without realizing they will be permanently stored in version control, exposing sensitive credentials and application identifiers to anyone with access to the repository.
**Prevention:** Use environment variables exclusively for secrets, credentials, and API endpoints. Remove single-use scripts containing credentials before committing them. Fallback values in application code should be empty strings or fail loudly if the required environment variables are not provided.

## 2024-03-28 - Information Leakage in Error Responses
**Vulnerability:** Admin delete routes (users, NGOs) were returning raw `err.message` to the client on 500 errors, potentially leaking internal database or application details.
**Learning:** Developers sometimes pass the catch block error directly to the response object without sanitizing it for production environments.
**Prevention:** Always catch and log the full error internally using the structured logger (`logger.error`), but return generic, safe error messages to the client (e.g., "Failed to delete user").
