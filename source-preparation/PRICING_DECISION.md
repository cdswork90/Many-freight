# Many Freight — subscription pricing decision (2026-11-06)

## Confirmed by owner
- **Additional driver / paid user seat:** USD **$49.95 per additional seat per month**, billed as a recurring subscription add-on.
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
- Next: confirm the desired Stripe test account, verify/create recurring add-on Price (4995 cents/month), implement seat entitlement and checkout/subscription quantity handling, then test subscription lifecycle.

## Operating entity decision (2026-11-06)
- **Visionary Transport LLC** remains the legal operating and payment-receiving entity for Many Freight. Do not require formation of a separate Many Freight LLC for this launch.
- **Many Freight** remains the customer-facing software brand/product. Use an accurately configured Stripe account under Visionary Transport LLC, not a fictitious independent legal entity.
- Track Many Freight subscription revenue and expenses separately in accounting, while recognizing they remain Visionary Transport LLC's income and obligations unless ownership/legal arrangements later change.
- Retain test-mode billing until security, database, webhook and subscription lifecycle checks pass. Do not move to live charging solely because of this entity choice.
- This documentation does not transfer personal ownership of IP or establish the right to retain Many Freight if Visionary Transport LLC is sold or ownership changes; address those rights in a separate written agreement.

## Updated seat price (2026-11-06)
- Latest owner instruction sets the additional seat price to **$49.95 per month**, superseding the previous $24.95 figure.
- The company base subscription remains separate, and no live price or customer subscription has been changed.
