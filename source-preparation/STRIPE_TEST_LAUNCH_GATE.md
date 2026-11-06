# Many Freight — Stripe TEST billing launch gate (2026-11-06)

**Do not enable live billing.** This document records verified configuration and remaining prerequisites for Stripe Billing + Stripe Tax only (no Stripe Connect). The app and customer entitlements must stay in test mode until end-to-end tests and launch checklist pass.

## Verified by connected Stripe API, test context
Account: `acct_1UXutnFHWLhESZ86` (Visionary transport llc sandbox; `livemode=false`).
- Carrier base: `price_1UYw2IFHWLhESZ86f2BNFCuq`, $49.95 monthly, includes 1 seat.
- Carrier additional seat: `price_1UYw2SFHWLhESZ86O2f1XMD1`, $24.95 monthly.
- Broker base: `price_1UYw57FHWLhESZ86f84seZYC`, $139.95 monthly, includes 2 seats.
- Broker additional seat: `price_1UYw59FHWLhESZ861FKkrQVK`, $75.95 monthly.
- All four prices are active, USD, monthly, tax-exclusive, test mode.
- Stripe `GET /v1/webhook_endpoints` returned **zero endpoints** for this account at review time. Do not represent webhooks as connected.
- Vercel project `many-freight` (`prj_sMZo3YGUmeHQiQTGDLdhQT96jsO9`) had the four Stripe price ID variables configured in **preview** but did **not** list `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or `APP_URL`. The preview code can derive a secure return URL from `VERCEL_URL`; this does not make a missing Stripe key usable.
- Vercel's authentication protection is configured for **all** deployments. The authenticated connector was denied with 403 when attempting to create a protection-bypass share link. **Before registering a Stripe webhook, ensure Stripe's servers can reach its exact public webhook URL without Vercel Authentication**, without exposing the rest of the app. Stripe cannot sign in to a protected preview.
- The owner reported the authenticated `/api/health` page showed `database: connected`. This validates reachability as observed, not subscription, tenant, tax, or security readiness.

## Required secure setup
1. Keep recovered reviewed code on branch `many-freight-secure-billing-recovery` as the source of truth; verify what branch/commit Vercel deploys before testing. Do not merge with the reset review branch blindly.
2. Provide Vercel **preview-only** `STRIPE_SECRET_KEY` as a secret beginning with `sk_test_`, using the hosting secret manager. Do **not** paste keys into GitHub, commit logs, or this document. A Stripe connector account is not itself an application API key.
3. Arrange a webhook test endpoint reachable by Stripe that retains signature verification, while keeping application pages behind auth. Endpoint: `https://<approved-test-host>/api/billing/webhook`. Register on the same Stripe sandbox account and configure at least `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Review whether `invoice.payment_failed`, `invoice.paid` and `checkout.session.expired` also need explicit reconciliation before launch.
4. Put the new **test** webhook signing secret `whsec_...` in Vercel preview `STRIPE_WEBHOOK_SECRET`; redeploy preview after environment changes. The secret is not interchangeable with the Stripe API key.
5. Confirm webhook and app belong to the same Stripe test account and that `STRIPE_SECRET_KEY` is test only; live webhooks and live Stripe secrets must never be accepted by the preview.
6. Verify app subscription metadata maps to the authenticated company and exact Stripe customer and subscription, with strict company isolation; test repeated and out-of-order webhooks.
7. Run real end-to-end **test-mode** lifecycle checks using Stripe test payment methods: new carrier and broker checkout, correct monthly price/seat quantity and tax handling, webhook acknowledgment, paid feature activation, seat additions and removals, renewal, failed payment, cancellation and expiration, admin portal access, and denial of access to other tenants. Record evidence and rollback/recovery steps.
8. Verify Stripe Tax tax-code, registrations, applicable jurisdictions, addresses and obligations separately; tax calculation does not itself establish filing or remittance.
9. Meet all remaining `PRODUCTION_LAUNCH_CHECKLIST.md` gates (RBAC, two-company isolation, storage, email, backups, legal pages, domain HTTPS, etc.). No live customer billing until those are actually verified.

## Known limitations
The recovered code intentionally blocks adding seats after subscription checkout begins until licensed seat reconciliation exists. Do **not** market additional-seat purchase flows as ready. User-reported database connectivity is not a complete go-live signoff. No test checkout, webhook delivery, or live customer payment was initiated by preparing this document.
