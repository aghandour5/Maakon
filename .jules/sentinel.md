## 2025-02-14 - Fix Missing CSRF Validation in optionalAuth

**Vulnerability:** The `optionalAuth` middleware in the Express API did not validate CSRF tokens for state-modifying HTTP methods (POST/PATCH/DELETE). This left any route relying on `optionalAuth` exposed to Cross-Site Request Forgery attacks, potentially allowing malicious actors to perform actions on behalf of partially or fully authenticated users.
**Learning:** `optionalAuth` was providing the benefits of a session without properly securing it against CSRF. In environments where components or middleware conditionally authenticate a request based on session cookies, you must apply the exact same CSRF protections as you do for strictly authenticated ones.
**Prevention:** Ensure that any middleware granting user privileges—even optionally—performs proper CSRF validation if handling state modifications.
