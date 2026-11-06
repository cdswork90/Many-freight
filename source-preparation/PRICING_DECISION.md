# Many Freight — subscription pricing decision (2026-11-06)

## Confirmed by owner
- **Additional driver / paid user seat:** USD **$24.95 per additional seat per month**, billed as a recurring subscription add-on.
- This is **not** the base company subscription price.
- One add-on seat corresponds to one additional billable user login; do not charge for an unactivated driver/contact record.
- Base company subscription remains a separate recurring line item and is not changed by this decision.
- The existing base plan amount must be verified before publishing customer checkout pricing.
- Add-on seat count should be derived from active billable seats, with server-side enforcement and Stripe quantity reconciliation.
- Use Stripe Billing subscriptions, not Stripe Connect; Stripe Tax only where configured and applicable.
- Require explicit price-and-quantity review before checkout; show base, seats, monthly subtotal and taxes clearly.
- Any seat quantity adjustments must respect the published proration policy, confirmed before activation.
- Use Stripe **test mode** for implementation and lifecycle testing; do not enable live customer billing yet.

## Implementation checkpoint
- Code currently has one base subscription Stripe price but lacks completed quantity-based seat billing.
- Existing Vercel preview environment contains STRIPE_ADDITIONAL_DRIVER_PRICE_ID, but its amount and Stripe account are **not verified**.
- Next: confirm the desired Stripe test account, verify/create recurring add-on Price (2495 cents/month), implement seat entitlement and checkout/subscription quantity handling, then test subscription lifecycle.
