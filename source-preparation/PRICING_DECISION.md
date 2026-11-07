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
- All four broker/carrier monthly sandbox prices have been created, and Vercel preview price environment variables configured; end-to-end checkout verification remains pending.
- Test checkout, webhook events, cancellations, failed payments, role isolation, and billing entitlement must pass before live charging.
- These code changes have not enabled live customer billing.

## Operating entity
- Many Freight is a software product operated by Visionary Transport LLC.
- Revenue and expenses can be tracked separately in accounting, but Visionary Transport LLC remains the legal payment-receiving entity.
- This plan does not change intellectual-property ownership.

## Stripe sandbox price creation and tax-exclusive policy (2026-11-06)
- User approved **applicable sales tax added on top of the listed subscription prices**. Prices are tax-exclusive, not tax-inclusive.
- Visionary Transport LLC sandbox carrier base Stripe price: `price_1UYw2IFHWLhESZ86f2BNFCuq` — USD 49.95/month, 1 seat included, `tax_behavior=exclusive`.
- Sandbox additional-carrier-seat Stripe price: `price_1UYw2SFHWLhESZ86O2f1XMD1` — USD 24.95/month, `tax_behavior=exclusive`.
- Both carrier price IDs have been written to the `many-freight` Vercel **preview** environment only. This doesn't turn on live billing; existing deployments require redeployment to pick up changed env vars.
- The sandbox still has zero configured Stripe Tax registrations and no global default tax code. No assumption is made about where Visionary is registered to collect sales tax. Tax-exclusive pricing does not itself enable automatic calculation or collection.
- The user confirmed online cloud-hosted business-use SaaS. Stripe catalog tax code `txcd_10103001` has now been assigned to two carrier products and two broker products in sandbox. Broker prices created: `price_1UYw57FHWLhESZ86f84seZYC` ($139.95 monthly with two included seats) and `price_1UYw59FHWLhESZ861FKkrQVK` ($75.95 per extra broker seat), both tax-exclusive. Both IDs have been configured in Vercel preview.
- Preview checkout remains test-only and incomplete pending correct tax configuration, database migration and end-to-end testing.

## Tax calculation configuration
- Stripe sandbox checkout now requests `automatic_tax: {enabled:true}`, required billing address collection, and allows Stripe to update customer address. It validates that both chosen prices are tax-exclusive.
- This does not register Visionary Transport LLC for sales tax or make Stripe Tax collect in states without an existing tax registration. Stripe Tax sandbox currently has zero registrations; identify verified registrations with the owner before changing this.
- Product tax classification is a configured Stripe category, not a legal determination of taxability. Tax obligations and registration state must be confirmed before live checkout.
- A review of the Supabase CompanyPlan migration and production access controls remains required. Sandbox prices being configured do not establish functioning subscriptions.
