# Many Freight — v1.6.0

Responsive Next.js + Prisma transportation-management SaaS foundation. The product supports standalone operation; external load-board connections are optional and company-controlled.

## Implemented in this source package

- Company registration, login, password hashing, signed HTTP-only sessions, and company-scoped data APIs.
- Responsive operations dashboard that reads from authenticated APIs rather than browser-only demo data.
- Load board with search, driver assignment, and shipment milestone updates.
- Driver accounts created by an owner; drivers see only loads assigned to their linked driver profile and may report pickup, transit, and delivery milestones.
- Customer portal accounts can be created with a customer record; customer users see only shipments, appointments, and invoices associated with their customer profile.
- Customer and driver directories, appointment scheduling, invoice creation/status changes, and expense ledger entry.
- AI freight lane planning endpoint (requires OpenAI API key and paid subscription); it does not assert live load availability or guaranteed market rates.
- Stripe subscription checkout, billing portal, and webhook synchronization foundation.
- Optional Super Dispatch / Central Dispatch connection records. These are not live provider adapters; authorized API documentation, credentials, and sandbox testing are still required.
- Company data isolation checks in the API layer and hardened session secret requirement in production.

## Local setup

Requirements: Node.js 20+, npm, and PostgreSQL 16+ (or Docker).

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` and a unique random `AUTH_SECRET` (at least 32 characters).
3. Start PostgreSQL and run `npm install`.
4. Run `npx prisma format && npm run db:validate && npm run db:generate`.
5. For a fresh database, apply the full current schema with `npm run db:push`. Review schema changes before applying to any database containing customer data; take a backup first.
6. Run `npm run dev`, then open `http://localhost:3000/register`.

## Recommended production hosting

Recommended deployment path: **Vercel + managed PostgreSQL (Neon or Supabase) + Stripe**. Use Supabase Storage or another private object store for bills of lading, proof-of-delivery, inspection images, and receipts when that upload feature is implemented. Vercel does not provision a database or Stripe account automatically.

1. Create a managed PostgreSQL database and copy its pooled/runtime and direct connection strings as required by that provider.
2. Push this repository to a private GitHub repository and import it into Vercel.
3. Set the production environment variables listed below in Vercel. Use a separate staging database and Stripe test-mode keys for preview deployments.
4. Ensure the build runs `prisma generate` (the `postinstall` script does this) and apply the reviewed Prisma schema to the database as a controlled release step.
5. Add the production HTTPS origin to `APP_URL`, configure the custom domain in Vercel, and wait for DNS/TLS validation.
6. Configure Stripe's recurring product/price and the webhook endpoint `https://YOUR_DOMAIN/api/billing/webhook` for `checkout.session.completed` and subscription created/updated/deleted events. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
7. Run end-to-end tests using test Stripe payments before enabling live mode.

## Required production environment

- `DATABASE_URL`: managed PostgreSQL URL.
- `AUTH_SECRET`: unique random secret, 32+ characters; never reuse the example value.
- `APP_URL`: deployed HTTPS origin.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`: Stripe subscription configuration.
- `OPENAI_API_KEY`: optional AI load planning; `OPENAI_MODEL` defaults to `gpt-4.1-mini`.

Optional provider variables are in `.env.example`. Do not store provider access tokens in ordinary text fields. A production credential vault/encrypted secret manager and provider-approved OAuth/API adapter are required before live sync.

## Important release limitations

This source archive is **not a deployed SaaS**. No hosting project, production database, domain, DNS, TLS certificate, Stripe account/product/webhook, OpenAI key, storage bucket, or provider API access is provisioned by this archive. The dashboard workflows are now API-connected, but no production build or integration test could be certified in this environment because dependency installation timed out and no production credentials/services were supplied.

Before accepting paying customers, complete and independently test: Prisma schema validation and deployment, TypeScript and production build, tenant-isolation and role-permission tests, Stripe test/live lifecycle and webhook idempotency, secure file upload/storage, email/password reset and account recovery, backups/restore, monitoring/alerts, audit logs, rate limiting, privacy/terms, accessibility, and penetration testing. Review FMCSA, state, insurance, tax, privacy, and contract requirements with qualified professionals. Software reminders are not a legal compliance determination.
