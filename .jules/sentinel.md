## 2025-04-16 - Account Takeover via Unverified Email Account Linking
**Vulnerability:** The application linked new Supabase OAuth logins to existing user accounts purely based on matching email addresses, without verifying if the email was actually verified by the identity provider.
**Learning:** This could allow an attacker to sign up via Supabase using a victim's unverified email address, resulting in the backend automatically linking the attacker's login to the victim's existing account and granting full access.
**Prevention:** Always check the `email_verified` flag from the identity provider before automatically linking accounts based on email address.
