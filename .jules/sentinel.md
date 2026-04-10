## 2024-03-24 - Missing Rate Limit on MFA Endpoints
**Vulnerability:** The `/auth/mfa-verify` and `/auth/mfa-challenge` endpoints were not rate-limited. This allowed for brute-force attacks against the 6-digit MFA tokens, effectively neutralizing the MFA protection.
**Learning:** It is crucial to rate-limit all authentication-related endpoints, not just the primary login endpoint, since MFA codes are short and easily brute-forced without limits.
**Prevention:** Always apply rate limiters (e.g., `express-rate-limit` or a custom sliding-window mechanism) to endpoints that handle passwords, PINs, OTPs, or MFA codes.
