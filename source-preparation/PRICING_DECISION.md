# Many Freight — approved subscription pricing (2026-11-06)

## Final pricing decision
- **$49.95 per month** for a company subscription, **including the first two internal user seats** (including the owner).
- **$24.95 per month for each internal user seat beyond those two**, starting with the third seat.
- Example monthly subtotals before any applicable taxes: 1–2 seats $49.95; 3 seats $74.90; 4 seats $99.85; 5 seats $124.80.
- Count billable logins with roles OWNER, ADMIN, DISPATCHER, DRIVER or ACCOUNTING, not customer portal logins, unactivated contacts, or driver records without login accounts.
- Base plan and additional seats are separate recurring Stripe Billing line items; no Stripe Connect.
- Validate monthly USD recurring Stripe test prices of 4995 cents and 2495 cents before test checkout.
- Show full total and any applicable tax before payment. Seat additions/removals after signup require a separate audited subscription quantity update and a defined proration policy; this remains pending.
- Do not enable live customer billing before integration, security and lifecycle tests pass.

## Entity
- Many Freight is the software brand operated by Visionary Transport LLC, the legal payment-receiving entity.
- Maintain separate Many Freight revenue and expense reporting, but that does not create a separate legal entity or separate IP ownership.

## Status
- Review-branch checkout has been configured to calculate add-on quantity as max(0, billable logins - 2).
- The sandbox's previously observed $60 base and $19.95 add-on Stripe prices do **not** satisfy the approved pricing.
- The correct Stripe test prices and environment configuration, subscription seat reconciliation, and end-to-end tests remain to be completed; no live charges are authorized.
