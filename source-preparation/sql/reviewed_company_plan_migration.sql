-- Many Freight: reviewed candidate migration for BROKER / CARRIER plans.
-- IMPORTANT: STAGING/REVIEW ONLY. NOT APPLIED TO SUPABASE.
-- Target: public."Company". Existing records default to CARRIER.
-- Preflight: inspect latest schema and database backup; do not run against
-- an unbacked-up shared/production database.
-- Supabase project initially had no "CompanyPlan" enum or "Company"."plan".
--
-- Apply in one transaction ONLY after staging tests and authorized backup:
BEGIN;
CREATE TYPE "CompanyPlan" AS ENUM ('CARRIER', 'BROKER');
ALTER TABLE "Company" ADD COLUMN "plan" "CompanyPlan" NOT NULL DEFAULT 'CARRIER';
COMMIT;
--
-- Postflight read-only checks:
-- SELECT column_name, data_type, udt_name, column_default
-- FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='Company' AND column_name='plan';
-- SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
-- WHERE t.typname='CompanyPlan' ORDER BY e.enumsortorder;
--
-- Rollback only if no company plan data exists and after explicit review:
-- BEGIN;
-- ALTER TABLE "Company" DROP COLUMN "plan";
-- DROP TYPE "CompanyPlan";
-- COMMIT;
