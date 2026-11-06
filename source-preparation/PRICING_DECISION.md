# Many Freight — subscription pricing and implementation (2026-11-06)

## Carrier / driver plan
- **$49.95 USD per month**, includes **one** internal user seat.
- Every additional internal seat is **$24.95 USD per month**, beginning with the second seat.
- Example monthly subtotals (before applicable taxes): 1 seat $49.95; 2 seats $74.90; 3 seats $99.85; 4 seats $124.80.

## Broker plan
- **$139.95 USD per month**, includes **two** internal broker-company user seats.
- Each additional broker seat is **$75.95 USD per month**, beginning with the third seat.
- Example monthly subtotals (before applicable taxes): 1–2 seats $139.95; 3 seats $215.90; 4 seats $291.85; 5 seats $367.80.

## Seat and account rules
- Internal user logins with roles OWNER, ADMIN, DISPATCHER, DRIVER or ACCOUNTING count as billable seats.
- Customer portal logins, unactivated contacts, and driver records without user logins do not count.
- The company plan is recorded on the Company database row as a CompanyPlan enum (CARRIER or BROKER), default CARRIER.
- Registration API supports the plan field; clients must expose an explicit broker/carrier selection to enroll broker companies.
- Server-side checkout selects the Stripe prices using the persisted Company.plan, never client-supplied price IDs.
- Test-only Stripe Billing uses four monthly recurring USD price environment variables: STRIPE_PRICE_ID (4995 cents), STRIPE_ADDITIONAL_DRIVER_PRICE_ID (2495), STRIPE_BROKER_PRICE_ID (13995), and STRIPE_BROKER_ADDITIONAL_SEAT_PRICE_ID (7595).
- Checkout fails closed if Stripe secret key is not test mode or configured prices differ from the amounts above.
- Broker plan entitlement and broker-only features must be enforced independently of the billing price; this is not complete.
- Seat changes after subscription start require a secure subscription quantity update, a defined proration policy, and webhook reconciliation; not complete.

## Database and launch precautions
- The new CompanyPlan enum and Company.plan field require a reviewed Prisma migration before deploying this branch against a database. **Do not apply a schema change to the existing Supabase database without backup and review.**
- Existing company records will default to CARRIER; changing a company's plan requires an audited, authorized server-side flow; not complete.
- Stripe sandbox prices for broker and carrier and their Vercel preview environment variables remain to be configured and verified.
- Test checkout, webhook events, cancellations, failed payments, role isolation, and billing entitlement must pass before live charging.
- These code changes have not enabled live customer billing.

## Operating entity
- Many Freight is a software product operated by Visionary Transport LLC.
- Revenue and expenses can be tracked separately in accounting, but Visionary Transport LLC remains the legal payment-receiving entity.
- This plan does not change intellectual-property ownership.
