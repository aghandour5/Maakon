## 2024-05-15 - [CSRF Bypass on State-Modifying GET Endpoints]
**Vulnerability:** A state-modifying endpoint (`/auth/mfa-setup` that creates and stores an MFA secret for admins) used a `GET` request.
**Learning:** `GET` endpoints bypass CSRF protection checks which are typically applied to `POST`, `PATCH`, and `DELETE` requests in the authentication middleware. This allowed potential CSRF attacks to initiate MFA setup for an admin without their consent.
**Prevention:** Always use `POST`, `PATCH`, or `DELETE` for endpoints that perform state modifications, especially in authentication or security configuration flows. Never use `GET` to modify server state.
