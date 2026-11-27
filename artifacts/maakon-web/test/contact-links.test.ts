import assert from "node:assert/strict";
import test from "node:test";
import { getContactHref } from "../src/lib/contact-links";

test("website contacts require an absolute HTTP or HTTPS address", () => {
  for (const value of ["https://example.org/join", "http://example.org/join"]) {
    assert.equal(getContactHref("website", value), value);
  }
  for (const value of ["javascript:alert(1)", "data:text/plain,hello", "//example.org", "example.org", ""]) {
    assert.equal(getContactHref("website", value), null);
  }
});
