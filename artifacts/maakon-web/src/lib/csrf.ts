const CSRF_COOKIE_NAME = "maakon_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const rawCookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName));

  if (!rawCookie) {
    return null;
  }

  return decodeURIComponent(rawCookie.slice(encodedName.length));
}

export function withCsrfHeader(
  method: string | undefined,
  headers?: HeadersInit,
): Headers {
  const mergedHeaders = new Headers(headers);
  const normalizedMethod = (method ?? "GET").toUpperCase();

  if (!CSRF_PROTECTED_METHODS.has(normalizedMethod)) {
    return mergedHeaders;
  }

  const csrfToken = readCookie(CSRF_COOKIE_NAME);
  if (csrfToken) {
    mergedHeaders.set(CSRF_HEADER_NAME, csrfToken);
  }

  return mergedHeaders;
}
