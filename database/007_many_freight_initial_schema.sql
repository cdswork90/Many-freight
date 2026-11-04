-- Installed in Supabase. Server-side Prisma access only; public API roles intentionally denied.
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT','BOOKED','ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED');
CREATE TYPE "UserRole" AS ENUM ('OWNER','ADMIN','DISPATCHER','DRIVER','ACCOUNTING','CUSTOMER');
CREATE TYPE "DamageSeverity" AS ENUM ('COSMETIC','MINOR','MODERATE','SEVERE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE','TRIALING','ACTIVE','PAST_DUE','CANCELED','UNPAID');
CREATE TYPE "ExpenseCategory" AS ENUM ('FUEL','TOLLS','MAINTENANCE','REPAIRS','LODGING','MEALS','INSURANCE','PERMITS','OTHER');
CREATE TYPE "AppointmentType" AS ENUM ('PICKUP','DELIVERY','SERVICE','INSPECTION','OTHER');
CREATE TABLE "Company" (
"id" TEXT NOT NULL PRIMARY KEY,
"name" TEXT NOT NULL,
"dotNumber" TEXT,
"mcNumber" TEXT,
"email" TEXT,
"phone" TEXT,
"address" TEXT,
"insuranceProvider" TEXT,
"insuranceExpiresAt" TIMESTAMP(3),
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "User" (
"id" TEXT NOT NULL PRIMARY KEY,
"companyId" TEXT NOT NULL,
"name" TEXT NOT NULL,
"email" TEXT NOT NULL,
"passwordHash" TEXT NOT NULL,
"role" "UserRole" NOT NULL DEFAULT 'DISPATCHER',
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Customer" (
"id" TEXT NOT NULL PRIMARY KEY,
"companyId" TEXT NOT NULL,
"name" TEXT NOT NULL,
"email" TEXT,
"phone" TEXT,
"billingAddress" TEXT,
"notes" TEXT,
"userId" TEXT UNIQUE,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Driver" (
"id" TEXT NOT NULL PRIMARY KEY,
"companyId" TEXT NOT NULL,
"name" TEXT NOT NULL,
"phone" TEXT,
"licenseNumber" TEXT,
"active" BOOLEAN NOT NULL DEFAULT true,
"userId" TEXT UNIQUE
);
CREATE TABLE "Shipment" (
"id" TEXT NOT NULL PRIMARY KEY,
"companyId" TEXT NOT NULL,
"customerId" TEXT,
"driverId" TEXT,
"reference" TEXT NOT NULL,
"status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
"freightType" TEXT NOT NULL DEFAULT 'General Freight',
"pickupName" TEXT,
"pickupAddress" TEXT NOT NULL,
"pickupAt" TIMESTAMP(3),
"dropoffName" TEXT,
"dropoffAddress" TEXT NOT NULL,
"dropoffAt" TIMESTAMP(3),
"vehicleYear" INTEGER,
"vehicleMake" TEXT,
"vehicleModel" TEXT,
"vin" TEXT,
"description" TEXT,
"weightLbs" DOUBLE PRECISION,
"rateCents" INTEGER NOT NULL DEFAULT 0,
"miles" DOUBLE PRECISION,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Invoice" (
"id" TEXT NOT NULL PRIMARY KEY,
"companyId" TEXT NOT NULL,
"shipmentId" TEXT,
"customerId" TEXT,
"number" TEXT NOT NULL,
"customerName" TEXT NOT NULL,
"amountCents" INTEGER NOT NULL,
"status" TEXT NOT NULL DEFAULT 'DRAFT',
"dueAt" TIMESTAMP(3),
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "DamageReport" (
"id" TEXT NOT NULL PRIMARY KEY,
"shipmentId" TEXT NOT NULL,
"category" "DamageSeverity" NOT NULL DEFAULT 'COSMETIC',
"description" TEXT NOT NULL,
"photoUrls" TEXT[],
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "TrackingEvent" (
"id" TEXT NOT NULL PRIMARY KEY,
"shipmentId" TEXT NOT NULL,
"latitude" DOUBLE PRECISION,
"longitude" DOUBLE PRECISION,
"note" TEXT,
"recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Subscription" (
"id" TEXT NOT NULL PRIMARY KEY,
"companyId" TEXT NOT NULL UNIQUE,
"stripeCustomerId" TEXT UNIQUE,
"stripeSubscriptionId" TEXT UNIQUE,
"stripePriceId" TEXT,
"status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
"currentPeriodEnd" TIMESTAMP(3),
"cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "RateLimitBucket" (
"key" TEXT NOT NULL PRIMARY KEY,
"count" INTEGER NOT NULL DEFAULT 0,
"resetAt" TIMESTAMP(3) NOT NULL,
"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Integration" (
"id" TEXT NOT NULL PRIMARY KEY,
"companyId" TEXT NOT NULL,
"provider" TEXT NOT NULL,
"status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
"externalAccountId" TEXT,
"secretRef" TEXT,
"lastSyncAt" TIMESTAMP(3),
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Expense" (
"id" TEXT NOT NULL PRIMARY KEY,
"companyId" TEXT NOT NULL,
"shipmentId" TEXT,
"driverId" TEXT,
"category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
"description" TEXT NOT NULL,
"amountCents" INTEGER NOT NULL,
"expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"odometerMiles" DOUBLE PRECISION,
"vendor" TEXT,
"receiptUrl" TEXT,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "Appointment" (
"id" TEXT NOT NULL PRIMARY KEY,
"companyId" TEXT NOT NULL,
"shipmentId" TEXT,
"customerId" TEXT,
"driverId" TEXT,
"type" "AppointmentType" NOT NULL DEFAULT 'OTHER',
"title" TEXT NOT NULL,
"location" TEXT,
"startsAt" TIMESTAMP(3) NOT NULL,
"endsAt" TIMESTAMP(3),
"notes" TEXT,
"status" TEXT NOT NULL DEFAULT 'SCHEDULED',
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "User_companyId_email_key" ON "User" ("companyId","email");
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
CREATE INDEX "User_companyId_idx" ON "User" ("companyId");
CREATE INDEX "Customer_companyId_idx" ON "Customer" ("companyId");
CREATE INDEX "Driver_companyId_idx" ON "Driver" ("companyId");
CREATE UNIQUE INDEX "Shipment_companyId_reference_key" ON "Shipment" ("companyId","reference");
CREATE INDEX "Shipment_companyId_status_idx" ON "Shipment" ("companyId","status");
CREATE UNIQUE INDEX "Invoice_companyId_number_key" ON "Invoice" ("companyId","number");
CREATE INDEX "Invoice_companyId_idx" ON "Invoice" ("companyId");
CREATE INDEX "TrackingEvent_shipmentId_recordedAt_idx" ON "TrackingEvent" ("shipmentId","recordedAt");
CREATE UNIQUE INDEX "Integration_companyId_provider_key" ON "Integration" ("companyId","provider");
CREATE INDEX "Integration_companyId_idx" ON "Integration" ("companyId");
CREATE INDEX "Expense_companyId_expenseDate_idx" ON "Expense" ("companyId","expenseDate");
CREATE INDEX "Appointment_companyId_startsAt_idx" ON "Appointment" ("companyId","startsAt");
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Company" FROM anon, authenticated;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "User" FROM anon, authenticated;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Customer" FROM anon, authenticated;
ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Driver" FROM anon, authenticated;
ALTER TABLE "Shipment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Shipment" FROM anon, authenticated;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Invoice" FROM anon, authenticated;
ALTER TABLE "DamageReport" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "DamageReport" FROM anon, authenticated;
ALTER TABLE "TrackingEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "TrackingEvent" FROM anon, authenticated;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Subscription" FROM anon, authenticated;
ALTER TABLE "RateLimitBucket" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "RateLimitBucket" FROM anon, authenticated;
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Integration" FROM anon, authenticated;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Expense" FROM anon, authenticated;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Appointment" FROM anon, authenticated;
