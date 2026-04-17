## 2025-02-27 - Rate limit missing on /reports endpoint
**Vulnerability:** Missing rate limit on /reports endpoint.
**Learning:** The /reports endpoint was not rate limited, making it vulnerable to abuse and spam.
**Prevention:** Always apply rate limiting to endpoints that accept user input to prevent abuse and spam.
