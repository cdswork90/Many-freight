# Many Freight — production launch checklist

## Infrastructure (requires owner-controlled accounts)
- [ ] Create production managed PostgreSQL instance and private credentials.
- [ ] Configure Vercel project from the private Git repository (or deploy Docker image to a managed container host).
- [ ] Configure all required environment variables in production and preview scopes separately.
- [ ] Run `npx prisma validate`, `npx prisma generate`, and apply the reviewed schema to the production database after backup.
- [ ] Verify `/api/health` returns `200` and `database: connected`.
- [ ] Add a custom domain in the hosting provider; configure DNS and wait for HTTPS certificate issuance.

## Billing and AI
- [ ] Create a Stripe recurring product and monthly price; set `STRIPE_PRICE_ID`.
- [ ] Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`, success URL, and cancel URL.
- [ ] Configure Stripe webhook for checkout completion and subscription lifecycle events.
- [ ] Run subscription checkout, cancellation, renewal, failed payment, and billing portal tests in Stripe test mode.
- [ ] Set `OPENAI_API_KEY`; set usage limits and budgets; test the AI route with a paid test account.

## Security and operations
- [ ] Generate a new random `AUTH_SECRET` (32+ characters) and store it only in the host secret manager.
- [ ] Test owner/admin/dispatcher/accounting/driver/customer access with at least two separate companies.
- [ ] Verify a driver can access only assigned loads and a customer only their own linked records.
- [ ] Configure private object storage and signed uploads before enabling POD, inspection photos, or receipt uploads.
- [ ] Configure transactional email, password reset, account recovery, audit logging, monitoring, alerting, backup, and restore drills.
- [ ] Complete accessibility, load, dependency, and independent penetration tests.
- [ ] Publish privacy policy, terms, subscription terms, and support contact.
- [ ] Obtain qualified legal/compliance review for applicable federal and state transportation, insurance, privacy, and recordkeeping obligations.

## Third-party connections
- [ ] Obtain approved API access and current partner documentation for each external load board/provider.
- [ ] Implement and test each provider adapter in sandbox before showing a connection as active.
- [ ] Use an encrypted credential vault; do not paste raw access tokens into the integration reference field.

Do not enable live customer billing until every required item is completed and verified. A green health check only confirms application/database reachability; it is not a full security or operational certification.
