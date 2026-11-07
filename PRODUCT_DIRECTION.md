# MANY FREIGHT — Carrier, Owner-Operator and Broker SaaS
Updated 2026-11-07

## Official product positioning
Many Freight is a responsive transportation-management SaaS for independent drivers, owner-operators, hotshot operators, small and midsize carriers, and **freight brokerage companies**. Both carriers and brokers must be able to register, subscribe, and purchase seats through their own company accounts. Broker enrollment is not to be removed as part of the driver-friendly product design.

Many Freight itself provides software; operating as a software vendor is separate from obtaining motor-carrier or freight-broker operating authority. Each subscribing company's own authority, insurance and bond/trust responsibilities remain its responsibility, subject to applicable law and verification.

## Customer account types
- **CARRIER**: independent owner-operator, hotshot operator, carrier or fleet company. Driver, dispatcher, owner/admin and accounting users can operate according to their assigned roles.
- **BROKER**: freight broker business with separate company subscription, user seats, customers, load posting/assignment and broker-appropriate workflows. Broker company ownership and permissions must be enforced at the API layer, not only by hiding menus.
- **CUSTOMER** and **DRIVER**: portal/user roles linked to their subscribing carrier or broker company as applicable; these are not independent broker/carrier subscriptions.

## Core workflows
1. Both carrier and broker companies register, select their company plan, and retain their own tenant-isolated data.
2. Create or receive loads, record customer details, pickup/delivery appointments, and assign eligible personnel or contracted carriers where implemented and authorized.
3. Capture inspections, damage reports, bills of lading, proof of delivery, photos and signatures using private storage when those features are implemented and verified.
4. Manage invoicing, expense entries, compliance records, insurance details and audit trails.
5. Support driver/customer portals and owner/admin/dispatcher roles with role- and company-scoped access.
6. Provide optional integrations for external load services, subject to partner API approval; core TMS workflows must remain standalone.

## Subscription prices currently represented in test checkout code
- Carrier: $49.95 per month, includes 1 billable internal seat, plus $24.95 for each additional billable internal seat.
- Broker: $139.95 per month, includes 2 billable internal seats, plus $75.95 for each additional billable internal seat.
- Applicable sales tax is additional where verified and configured.
- Billing remains **test-only**. Live payments must remain disabled until Stripe products, tax rules/registrations, webhooks, seat reconciliation, entitlements and security end-to-end testing are complete.
- New company signup alone does not authorize real operational access. Demonstration loads must be clearly simulated and isolated from real work.

## Release boundaries
Do not remove or block broker registration. Do not market Many Freight itself as an FMCSA-licensed brokerage or imply that a software subscription grants operating authority. Do not claim completed external integrations, GPS, AI, payment processing or app-store availability before verification. Do not unlock production operations for unpaid/unverified accounts. Require multi-tenant isolation, access-control tests and a reviewed production rollout before changing deployment protection.
