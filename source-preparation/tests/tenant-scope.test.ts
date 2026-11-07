import assert from "node:assert/strict";
import { test } from "node:test";
import {
  shipmentScope, appointmentScope, driverShipmentProjection,
  driverDirectoryProjection,
} from "../src/lib/tenant-scope";

type Role = "OWNER" | "ADMIN" | "DISPATCHER" | "ACCOUNTING" | "DRIVER" | "CUSTOMER";
const session = (companyId: string, role: Role, userId = "user-1") =>
  ({ companyId, role, userId });

for (const scope of [shipmentScope, appointmentScope]) {
  test(scope.name + " always isolates owner, admin, dispatcher and accounting queries", () => {
    for (const role of ["OWNER", "ADMIN", "DISPATCHER", "ACCOUNTING"] as Role[]) {
      assert.deepEqual(scope(session("carrier-A", role)), { companyId: "carrier-A" });
      assert.deepEqual(scope(session("broker-B", role)), { companyId: "broker-B" });
    }
  });
  test(scope.name + " restricts driver to own assignments within company", () => {
    assert.deepEqual(scope(session("carrier-A", "DRIVER", "driver-1")), {
      companyId: "carrier-A", driver: { userId: "driver-1" },
    });
  });
  test(scope.name + " restricts customer to own records within company", () => {
    assert.deepEqual(scope(session("broker-B", "CUSTOMER", "customer-1")), {
      companyId: "broker-B", customer: { userId: "customer-1" },
    });
  });
}

test("driver shipment projection does not disclose customer rate or VIN", () => {
  assert.equal(Object.hasOwn(driverShipmentProjection, "rateCents"), false);
  assert.equal(Object.hasOwn(driverShipmentProjection, "vin"), false);
  assert.equal(Object.hasOwn(driverShipmentProjection, "vehicleYear"), false);
  assert.equal(Object.hasOwn(driverShipmentProjection.customer.select, "phone"), false);
  assert.equal(driverShipmentProjection.pickupAddress, true);
  assert.equal(driverShipmentProjection.status, true);
});

test("only owner, admin and own driver profile can return a license identifier", () => {
  for (const role of ["ACCOUNTING", "DISPATCHER", "CUSTOMER"] as Role[]) {
    assert.equal(Object.hasOwn(driverDirectoryProjection(session("A", role)), "licenseNumber"), false);
  }
  for (const role of ["OWNER", "ADMIN", "DRIVER"] as Role[]) {
    assert.equal(driverDirectoryProjection(session("A", role)).licenseNumber, true);
  }
});
