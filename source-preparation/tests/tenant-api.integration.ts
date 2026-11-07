/**
 * End-to-end HTTP access checks using a disposable local PostgreSQL database.
 * This must never run against a production or remotely hosted database.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const databaseUrl = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1"].includes(databaseUrl.hostname) ||
    databaseUrl.pathname !== "/many_freight_test") {
  throw new Error("Refusing integration tests outside disposable local database.");
}

const prisma = new PrismaClient();
const origin = "http://127.0.0.1:3100";
let logTail = "";
const server = spawn("npm", ["run", "dev", "--", "-p", "3100"], {
  cwd: process.cwd(), env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  detached: process.platform !== "win32",
  stdio: ["ignore", "pipe", "pipe"],
});
function rememberLog(chunk: Buffer) { logTail = (logTail + chunk.toString()).slice(-2500); }
server.stdout?.on("data", rememberLog);
server.stderr?.on("data", rememberLog);

async function ready() {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error("Development server exited: " + logTail);
    try {
      const response = await fetch(origin + "/api/health", { signal: AbortSignal.timeout(2500) });
      if (response.ok && (await response.json()).database === "connected") return;
    } catch { /* server not ready */ }
    await delay(2000);
  }
  throw new Error("Local test server did not connect to test DB. " + logTail);
}
type ApiResult = { status: number; data: any; cookie: string };
async function request(
  path: string, method = "GET", body?: unknown, cookie?: string,
): Promise<ApiResult> {
  const response = await fetch(origin + path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => null);
  return {
    status: response.status, data,
    cookie: response.headers.get("set-cookie")?.split(";")[0] || "",
  };
}
async function register(name: string, plan: "CARRIER" | "BROKER") {
  const email = name.toLowerCase().replaceAll(" ", "-") + "@local.test";
  const password = "Temporary-Test-Password-12345";
  const r = await request("/api/auth/register", "POST", {
    companyName: name, plan, name: name + " Owner", email, password,
  });
  assert.equal(r.status, 201, name + " registration: " + JSON.stringify(r.data));
  assert.equal(r.data.company.plan, plan);
  assert.ok(r.cookie.includes("ttpro_session="));
  return { ...r.data, cookie: r.cookie, email, password };
}
async function paid(companyId: string, suffix: string) {
  await prisma.subscription.update({
    where: { companyId },
    data: {
      status: "ACTIVE", stripeSubscriptionId: "sub_disposable_" + suffix,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
    },
  });
}
async function login(email: string, password: string) {
  const r = await request("/api/auth/login", "POST", { email, password });
  assert.equal(r.status, 200, "Login for " + email + ": " + JSON.stringify(r.data));
  assert.ok(r.cookie);
  return r.cookie;
}
async function run() {
  await ready();
  const carrier = await register("Isolated Carrier Alpha", "CARRIER");
  const broker = await register("Isolated Broker Beta", "BROKER");
  const unpaid = await register("Unpaid Broker Gamma", "BROKER");

  const unpaidGet = await request("/api/shipments", "GET", undefined, unpaid.cookie);
  assert.equal(unpaidGet.status, 402);
  assert.equal(unpaidGet.data.code, "SUBSCRIPTION_REQUIRED");
  const unpaidPost = await request("/api/shipments", "POST", {
    reference:"UNPAID",pickupAddress:"Dallas",dropoffAddress:"Houston",
  }, unpaid.cookie);
  assert.equal(unpaidPost.status, 402);
  const billing = await request("/api/billing/status", "GET", undefined, unpaid.cookie);
  assert.equal(billing.status, 200);
  assert.equal(billing.data.active, false);
  console.log("PASS: unpaid broker can register and access billing, not real loads");

  await paid(carrier.company.id, "carrier");
  await paid(broker.company.id, "broker");
  const shipmentBody = {
    reference: "TENANT-A-100", pickupAddress: "Dallas, TX",
    dropoffAddress: "Houston, TX", rateCents: 240000,
  };
  const created = await request("/api/shipments", "POST", shipmentBody, carrier.cookie);
  assert.equal(created.status, 201, "Carrier load creation: " + JSON.stringify(created.data));
  const shipmentId = created.data.id;
  assert.ok(shipmentId);

  const carrierList = await request("/api/shipments", "GET", undefined, carrier.cookie);
  const brokerList = await request("/api/shipments", "GET", undefined, broker.cookie);
  assert.equal(carrierList.status, 200);
  assert.equal(brokerList.status, 200);
  assert.equal(carrierList.data.length, 1);
  assert.equal(brokerList.data.length, 0);
  const crossPatch = await request("/api/shipments/" + shipmentId, "PATCH", { status:"DELIVERED" }, broker.cookie);
  assert.equal(crossPatch.status, 404);
  const brokerCreated = await request("/api/shipments", "POST", {
    reference:"TENANT-B-200",pickupAddress:"Austin, TX",
    dropoffAddress:"San Antonio, TX",rateCents:150000,
  }, broker.cookie);
  assert.equal(brokerCreated.status, 201);
  const carrierAfter = await request("/api/shipments", "GET", undefined, carrier.cookie);
  assert.deepEqual(carrierAfter.data.map((s:any)=>s.reference), ["TENANT-A-100"]);
  console.log("PASS: carrier/broker separation for listing, creation and cross-company updates");

  const passwordHash = await bcrypt.hash("Temporary-Driver-Password-123", 12);
  const driver = await prisma.user.create({
    data: {
      companyId: carrier.company.id, name:"Sample Driver",
      email:"driver-alpha@local.test",passwordHash,role:"DRIVER",
      driverProfile: {
        create:{
          name:"Sample Driver",licenseNumber:"CONFIDENTIAL-LICENSE-123",
          company:{connect:{id:carrier.company.id}},
        },
      },
    },
    include:{driverProfile:true},
  });
  assert.ok(driver.driverProfile);
  const assign = await request("/api/shipments/" + shipmentId, "PATCH", {
    driverId:driver.driverProfile.id,
  }, carrier.cookie);
  assert.equal(assign.status, 200);
  const driverCookie = await login(driver.email, "Temporary-Driver-Password-123");
  const driverLoads = await request("/api/shipments", "GET", undefined, driverCookie);
  assert.equal(driverLoads.status, 200);
  assert.equal(driverLoads.data.length, 1);
  assert.equal(driverLoads.data[0].reference, "TENANT-A-100");
  assert.equal(Object.hasOwn(driverLoads.data[0], "rateCents"), false);
  assert.equal(Object.hasOwn(driverLoads.data[0], "vin"), false);
  console.log("PASS: assigned driver sees route but no customer contract rate or VIN");

  const dispatcher = await prisma.user.create({
    data:{
      companyId:carrier.company.id,name:"Sample Dispatcher",
      email:"dispatcher-alpha@local.test",
      passwordHash,role:"DISPATCHER",
    },
  });
  const dispatcherCookie = await login(dispatcher.email, "Temporary-Driver-Password-123");
  const dispatcherDrivers = await request("/api/drivers", "GET", undefined, dispatcherCookie);
  assert.equal(dispatcherDrivers.status, 200);
  assert.equal(dispatcherDrivers.data.length, 1);
  assert.equal(Object.hasOwn(dispatcherDrivers.data[0], "licenseNumber"), false);
  const ownerDrivers = await request("/api/drivers", "GET", undefined, carrier.cookie);
  assert.equal(ownerDrivers.status, 200);
  assert.equal(ownerDrivers.data[0].licenseNumber, "CONFIDENTIAL-LICENSE-123");
  console.log("PASS: driver licensing is not exposed to dispatcher role");

  const brokerOther = await request("/api/drivers", "GET", undefined, broker.cookie);
  assert.equal(brokerOther.status, 200);
  assert.equal(brokerOther.data.length, 0);
  console.log("PASS: driver directory tenant isolation");

  // Protect customer portal records within and between broker companies.
  const customerOne=await request("/api/customers","POST",{
    name:"Broker Customer One",email:"customer-one@example.test"
  },broker.cookie);
  const customerTwo=await request("/api/customers","POST",{
    name:"Broker Customer Two",email:"customer-two@example.test"
  },broker.cookie);
  assert.equal(customerOne.status,201,JSON.stringify(customerOne.data));
  assert.equal(customerTwo.status,201,JSON.stringify(customerTwo.data));
  const crossCompanyInvite=await request(
    "/api/customers/"+customerOne.data.id+"/portal","POST",
    {name:"Intruding User",email:"intruder@example.test",password:"Test-Portal-Password-123"},
    carrier.cookie
  );
  assert.equal(crossCompanyInvite.status,404);
  const customerEmail="portal-one@local.test", customerPassword="Test-Portal-Password-123";
  const invitation=await request(
    "/api/customers/"+customerOne.data.id+"/portal","POST",
    {name:"Portal Customer One",email:customerEmail,password:customerPassword},
    broker.cookie
  );
  assert.equal(invitation.status,201,JSON.stringify(invitation.data));
  const duplicateInvitation=await request(
    "/api/customers/"+customerOne.data.id+"/portal","POST",
    {name:"Another Customer",email:"portal-another@local.test",password:customerPassword},
    broker.cookie
  );
  assert.equal(duplicateInvitation.status,409);
  assert.equal(
    await prisma.user.count({where:{email:"portal-another@local.test"}}),0,
    "Failed customer portal invitation must never leave an orphan login"
  );
  const customerCookie=await login(customerEmail,customerPassword);
  const ownCustomerRecords=await request("/api/customers","GET",undefined,customerCookie);
  assert.equal(ownCustomerRecords.status,200);
  assert.deepEqual(ownCustomerRecords.data.map((x:any)=>x.id),[customerOne.data.id]);
  const crossCompanyCustomerUpdate=await request(
    "/api/customers/"+customerOne.data.id,"PATCH",{name:"Bad Cross-Company Edit"},carrier.cookie
  );
  assert.equal(crossCompanyCustomerUpdate.status,404);
  console.log("PASS: broker customer-portal signup, single-customer visibility and cross-tenant update isolation");

  const assignCustomer=await request(
    "/api/shipments/"+brokerCreated.data.id,"PATCH",{customerId:customerOne.data.id},broker.cookie
  );
  assert.equal(assignCustomer.status,200);
  const customerShipments=await request("/api/shipments","GET",undefined,customerCookie);
  assert.equal(customerShipments.status,200);
  assert.deepEqual(customerShipments.data.map((x:any)=>x.reference),["TENANT-B-200"]);

  const createInvoice=async(number:string,customerId:string)=>request(
    "/api/invoices","POST",
    {number,customerId,customerName:"Sample Brokerage Customer",amountCents:6000},
    broker.cookie
  );
  const firstInvoice=await createInvoice("BROKER-INV-1",customerOne.data.id);
  const otherInvoice=await createInvoice("BROKER-INV-2",customerTwo.data.id);
  assert.equal(firstInvoice.status,201,JSON.stringify(firstInvoice.data));
  assert.equal(otherInvoice.status,201,JSON.stringify(otherInvoice.data));
  const customerInvoices=await request("/api/invoices","GET",undefined,customerCookie);
  assert.equal(customerInvoices.status,200);
  assert.deepEqual(customerInvoices.data.map((x:any)=>x.number),["BROKER-INV-1"]);

  const makeAppointment=async(title:string,customerId:string)=>request(
    "/api/appointments","POST",
    {title,customerId,type:"PICKUP",startsAt:"2027-01-12T15:00:00.000Z"},
    broker.cookie
  );
  const ownAppointment=await makeAppointment("Pickup for customer one",customerOne.data.id);
  const otherAppointment=await makeAppointment("Pickup for customer two",customerTwo.data.id);
  assert.equal(ownAppointment.status,201,JSON.stringify(ownAppointment.data));
  assert.equal(otherAppointment.status,201,JSON.stringify(otherAppointment.data));
  const appointments=await request("/api/appointments","GET",undefined,customerCookie);
  assert.equal(appointments.status,200);
  assert.deepEqual(appointments.data.map((x:any)=>x.title),["Pickup for customer one"]);
  console.log("PASS: customer portal is isolated to own loads, invoices and appointments");
}

run().then(
  () => console.log("PASS: all disposable-database HTTP isolation checks"),
  err => { console.error("FAILED: HTTP tenant tests", err); process.exitCode=1; },
).finally(async () => {
  // npm spawns a Next.js child process; terminate the whole disposable
  // process group so CI does not hang after the assertions finish.
  if (process.platform !== "win32" && server.pid) {
    try { process.kill(-server.pid, "SIGTERM"); }
    catch { server.kill("SIGTERM"); }
  } else {
    server.kill("SIGTERM");
  }
  await prisma.$disconnect();
});
