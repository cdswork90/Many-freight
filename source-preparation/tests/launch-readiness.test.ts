import assert from "node:assert/strict";
import { test } from "node:test";
import { isSessionSigningConfigured } from "../src/lib/launch-readiness";

test("rejects absent and weak production authentication secrets", () => {
  assert.equal(isSessionSigningConfigured(undefined, true), false);
  assert.equal(isSessionSigningConfigured("", true), false);
  assert.equal(isSessionSigningConfigured("short-secret", true), false);
  assert.equal(isSessionSigningConfigured("x".repeat(31), true), false);
});

test("accepts strong production signing keys", () => {
  assert.equal(isSessionSigningConfigured("x".repeat(32), true), true);
  assert.equal(isSessionSigningConfigured("x".repeat(64), true), true);
});

test("local development is allowed to use a disposable key", () => {
  assert.equal(isSessionSigningConfigured(undefined, false), true);
});
