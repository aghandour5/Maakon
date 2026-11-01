/** Require authenticated TLS for remote database connections. */
export function getDatabaseConnectionString(value: string | undefined): string {
  if (!value) {
    throw new Error("DATABASE_URL must be set.");
  }

  let url: URL;
  try {
    url = new URL(value);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      throw new Error("Invalid protocol");
    }
  } catch {
    // URL parsing errors can include their input; never expose credentials.
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  // pg honors the last host query parameter over the URL hostname.
  const host = (
    url.searchParams.getAll("host").at(-1) || decodeURIComponent(url.hostname)
  ).toLowerCase();
  const isLoopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);

  if (!isLoopback) {
    // Set this in the URL: pg can replace an explicit ssl object with URL options.
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}

/** Maintenance commands must never fall back to the API's credentials. */
export function getAdminDatabaseConnectionString(
  value: string | undefined,
): string {
  if (!value) {
    throw new Error("DATABASE_ADMIN_URL must be set for database maintenance.");
  }
  return getDatabaseConnectionString(value);
}
