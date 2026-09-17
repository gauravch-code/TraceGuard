import assert from "node:assert/strict";
import { test } from "node:test";
import { browserWriteError } from "../app/api/browser-origin.ts";

test("same-origin JSON writes are accepted", () => {
  const request = new Request("https://traceguard.test/api/reviews", { method: "POST", headers: { Origin: "https://traceguard.test", "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json" } });
  assert.equal(browserWriteError(request, true), null);
});

test("cross-origin browser writes are rejected", () => {
  const request = new Request("https://traceguard.test/api/reviews", { method: "POST", headers: { Origin: "https://other.test", "Sec-Fetch-Site": "cross-site", "Content-Type": "application/json" } });
  assert.equal(browserWriteError(request, true)?.status, 403);
});

test("form writes cannot reach JSON routes", () => {
  const request = new Request("https://traceguard.test/api/reviews", { method: "POST", headers: { "Content-Type": "text/plain" } });
  assert.equal(browserWriteError(request, true)?.status, 415);
});
