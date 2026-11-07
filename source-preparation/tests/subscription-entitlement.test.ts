import assert from "node:assert/strict";
import { test } from "node:test";
import { hasPaidOperationalAccess } from "../src/lib/subscription-entitlement";

const now = new Date("2026-11-07T12:00:00.000Z");
const active = {
  status: "ACTIVE",
  stripeSubscriptionId: "sub_verified_test",
  currentPeriodEnd: new Date("2026-12-07T12:00:00.000Z"),
};

test("valid active subscription allows live operations", () => {
  assert.equal(hasPaidOperationalAccess(active, now), true);
});

for (const status of ["INCOMPLETE", "TRIALING", "PAST_DUE", "CANCELED", "UNPAID"]) {
  test(status + " cannot access live operations", () => {
    assert.equal(hasPaidOperationalAccess({ ...active, status }, now), false);
  });
}

test("missing subscription and missing Stripe identity fail closed", () => {
  assert.equal(hasPaidOperationalAccess(null, now), false);
  assert.equal(hasPaidOperationalAccess({ ...active, stripeSubscriptionId: null }, now), false);
  assert.equal(hasPaidOperationalAccess({ ...active, stripeSubscriptionId: "fake_id" }, now), false);
});

test("expired, missing or invalid paid periods fail closed", () => {
  assert.equal(hasPaidOperationalAccess({ ...active, currentPeriodEnd: now }, now), false);
  assert.equal(hasPaidOperationalAccess({ ...active, currentPeriodEnd: new Date("2026-11-06T12:00:00.000Z") }, now), false);
  assert.equal(hasPaidOperationalAccess({ ...active, currentPeriodEnd: null }, now), false);
  assert.equal(hasPaidOperationalAccess({ ...active, currentPeriodEnd: new Date("invalid") }, now), false);
});

test("future paid period remains valid", () => {
  assert.equal(hasPaidOperationalAccess({ ...active, currentPeriodEnd: new Date(now.getTime() + 1) }, now), true);
});
