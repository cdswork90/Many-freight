# Many Freight — broker plan database migration and Stripe tax review

Date: 2026-11-06. This file documents a **read-only assessment** and is NOT an executed database migration.

## Verified status
- GitHub review-branch CI on commit 4604d7fa passed dependencies, Prisma validation and client generation, typecheck and Next.js production build (run 42307729642).
- Supabase project kekilfhknfuozemlwryv reports healthy and has Company, User, Subscription and Shipment tables.
- Supabase has **neither** a public.Company.plan column nor a PostgreSQL enum named CompanyPlan as of this check. Checkout code depending on Company.plan will fail against this schema until a migration is reviewed/applied.
- The current Vercel preview includes Supabase/Postgres environment variables; DATABASE_URL was previously missing, and live app-database connectivity remains unverified.
- The Stripe Visionary Transport sandbox has existing monthly prices $60 and $19.95, not the required approved plans.

## Reviewed intended migration (not executed)
Use Prisma migration generation against a *separate disposable copy* of the existing database or produce an inspected migration diff before any deployment.
The intended additive SQL is:
```sql
CREATE TYPE "CompanyPlan" AS ENUM ('CARRIER', 'BROKER');
ALTER TABLE "Company"
  ADD COLUMN "plan" "CompanyPlan" NOT NULL DEFAULT 'CARRIER';
```
This is a **proposal, not approval to execute**. Compare with actual schema and migrations, back up, stage and test. Existing companies default to CARRIER, so broker-company reassignment needs owner approval and an audited update.

## Billing controls still required
- Stripe test prices: carrier base $49.95/1 seat; extra $24.95 each; broker base $139.95/2 seats; extra $75.95 each.
- Existing Stripe sandbox products have no product tax_code; Stripe Tax defaults have no tax_code or tax_behavior, with zero tax registrations shown. Do not guess taxable jurisdictions, register a jurisdiction without proof or activate live billing.
- Stripe catalog suggests **Software as a service (SaaS) - business use** (txcd_10103001) for a cloud-hosted business dispatch application; confirm this classification before creating/updating products.
- Confirm whether advertised subscription prices are **exclusive of** any applicable sales tax or **inclusive**; currently project copy says prices exclude tax.
- Before production, check webhook idempotency, secure broker/carrier entitlements, seat count reconciliation on seat changes, proration and multi-company access tests.
- No Stripe live charges or Supabase schema writes performed as part of this review.
