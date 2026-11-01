import assert from "node:assert/strict";
import test from "node:test";
import type { ConnectionOptions } from "node:tls";
import pg from "pg";
import {
  getAdminDatabaseConnectionString,
  getDatabaseConnectionString,
} from "../src/connection-config";

const remoteUrl =
  "postgresql://review:synthetic-password@db.example.test/maakon";

test("maintenance requires an explicitly supplied admin URL", () => {
  assert.throws(
    () => getAdminDatabaseConnectionString(undefined),
    /DATABASE_ADMIN_URL must be set/,
  );
});

test("admin connections retain the verified TLS policy", () => {
  const url = new URL(
    getAdminDatabaseConnectionString(`${remoteUrl}?sslmode=disable`),
  );
  assert.equal(url.searchParams.get("sslmode"), "verify-full");
});

test("remote connections require full TLS verification", () => {
  const url = new URL(getDatabaseConnectionString(remoteUrl));
  assert.equal(url.searchParams.get("sslmode"), "verify-full");
  assert.equal(url.username, "review");
  assert.equal(url.password, "synthetic-password");
});

for (const sslmode of [
  "disable",
  "no-verify",
  "prefer",
  "require",
  "verify-ca",
]) {
  test(`remote sslmode=${sslmode} is upgraded to verify-full`, () => {
    const url = new URL(
      getDatabaseConnectionString(`${remoteUrl}?sslmode=${sslmode}`),
    );
    assert.equal(url.searchParams.get("sslmode"), "verify-full");
  });
}

for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
  test(`loopback ${host} remains usable without TLS`, () => {
    const url = new URL(
      getDatabaseConnectionString(`postgresql://review@${host}/maakon`),
    );
    assert.equal(url.searchParams.has("sslmode"), false);
  });
}

test("explicit loopback TLS settings are retained", () => {
  const url = new URL(
    getDatabaseConnectionString(
      "postgresql://localhost/maakon?sslmode=verify-full",
    ),
  );
  assert.equal(url.searchParams.get("sslmode"), "verify-full");
});

test("a remote host override cannot bypass TLS using a loopback URL hostname", () => {
  const url = new URL(
    getDatabaseConnectionString(
      "postgresql://localhost/maakon?host=db.example.test&sslmode=disable",
    ),
  );
  assert.equal(url.searchParams.get("sslmode"), "verify-full");
});

test("duplicate host and SSL parameters cannot disable remote TLS", () => {
  const url = new URL(
    getDatabaseConnectionString(
      `${remoteUrl}?host=localhost&host=db.example.test&sslmode=verify-full&sslmode=disable`,
    ),
  );
  assert.deepEqual(url.searchParams.getAll("sslmode"), ["verify-full"]);
});

test("custom CA and unrelated connection options survive normalization", () => {
  const url = new URL(
    getDatabaseConnectionString(
      `${remoteUrl}?sslrootcert=%2Fcerts%2Fdatabase.crt&application_name=maakon&connect_timeout=10`,
    ),
  );
  assert.equal(url.searchParams.get("sslrootcert"), "/certs/database.crt");
  assert.equal(url.searchParams.get("application_name"), "maakon");
  assert.equal(url.searchParams.get("connect_timeout"), "10");
  assert.equal(url.searchParams.get("sslmode"), "verify-full");
});

test("missing configuration produces a safe error", () => {
  assert.throws(
    () => getDatabaseConnectionString(undefined),
    /^Error: DATABASE_URL must be set\.$/,
  );
});

test("invalid configuration never includes credentials in its error", () => {
  const secret = "synthetic-secret-that-must-not-leak";
  for (const value of [
    `postgresql://user:${secret}@[invalid`,
    `https://user:${secret}@example.test/maakon`,
  ]) {
    assert.throws(
      () => getDatabaseConnectionString(value),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message.includes(secret), false);
        assert.equal("input" in error, false);
        return true;
      },
    );
  }
});

for (const options of [
  "ssl=false",
  "ssl=no-verify",
  "sslmode=disable",
  "uselibpqcompat=true&sslmode=require",
  "host=localhost&host=db.example.test&sslmode=disable",
]) {
  test(`pg retains remote TLS verification with ${options}`, () => {
    const client = new pg.Client({
      connectionString: getDatabaseConnectionString(`${remoteUrl}?${options}`),
    });
    // pg's types declare ssl as boolean; the driver also exposes TLS options.
    const ssl = (client as unknown as { ssl: boolean | ConnectionOptions }).ssl;
    assert.ok(ssl && typeof ssl === "object");
    assert.notEqual(ssl.rejectUnauthorized, false);
    assert.equal(ssl.checkServerIdentity, undefined);
  });
}
