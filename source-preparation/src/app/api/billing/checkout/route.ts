import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The company plan is persisted server-side during registration. Never choose
// a cheaper price based solely on a checkout request parameter.
const paidSeatRoles = ["OWNER", "ADMIN", "DISPATCHER", "DRIVER", "ACCOUNTING"] as const;
const plans = {
  CARRIER: {
    baseEnv: "STRIPE_PRICE_ID",
    additionalEnv: "STRIPE_ADDITIONAL_DRIVER_PRICE_ID",
    includedSeats: 1,
    baseCents: 4995,
    additionalCents: 2495,
  },
  BROKER: {
    baseEnv: "STRIPE_BROKER_PRICE_ID",
    additionalEnv: "STRIPE_BROKER_ADDITIONAL_SEAT_PRICE_ID",
    includedSeats: 2,
    baseCents: 13995,
    additionalCents: 7595,
  },
} as const;

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.role))
    return NextResponse.json({ error: "Only company owners or admins can manage billing." }, { status: 403 });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_"))
    return NextResponse.json({ error: "Only Stripe test-mode checkout is enabled." }, { status: 503 });
  // Preview deployments get a trusted host from Vercel. Production still
  // requires an explicitly configured APP_URL and remains blocked in test mode.
  const redirectOrigin = process.env.APP_URL ||
    (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!redirectOrigin || !redirectOrigin.startsWith("https://"))
    return NextResponse.json({ error: "Secure checkout redirect URL is missing." }, { status: 503 });

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  const sub = await prisma.subscription.findUnique({ where: { companyId: session.companyId } });
  if (!company || !sub) return NextResponse.json({ error: "Company billing profile missing." }, { status: 404 });
  if (sub.stripeSubscriptionId)
    return NextResponse.json({ error: "A subscription already exists. Seat changes require subscription reconciliation." }, { status: 409 });

  const plan = plans[company.plan];
  const basePriceId = process.env[plan.baseEnv];
  const additionalPriceId = process.env[plan.additionalEnv];
  if (!basePriceId || !additionalPriceId)
    return NextResponse.json({ error: `${company.plan} test prices are not configured.` }, { status: 503 });

  const stripe = new Stripe(key);
  const [basePrice, additionalPrice] = await Promise.all([
    stripe.prices.retrieve(basePriceId),
    stripe.prices.retrieve(additionalPriceId),
  ]);
  const monthlyTestPrice = (p: Stripe.Price) =>
    p.active && !p.livemode && p.currency === "usd" && p.type === "recurring" &&
    p.recurring?.interval === "month" && p.recurring.interval_count === 1 &&
    p.recurring.usage_type === "licensed";
  if (!monthlyTestPrice(basePrice) || !monthlyTestPrice(additionalPrice) ||
      basePrice.unit_amount !== plan.baseCents || additionalPrice.unit_amount !== plan.additionalCents ||
      basePrice.id === additionalPrice.id ||
      basePrice.tax_behavior !== "exclusive" || additionalPrice.tax_behavior !== "exclusive") {
    return NextResponse.json({
      error: `Stripe ${company.plan} prices must match approved monthly plan amounts.`
    }, { status: 503 });
  }

  const billableSeats = await prisma.user.count({
    where: { companyId: session.companyId, role: { in: [...paidSeatRoles] } },
  });
  const additionalSeats = Math.max(0, billableSeats - plan.includedSeats);

  let customerId = sub.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: company.name, email: session.email,
      metadata: { companyId: company.id, product: "many-freight", plan: company.plan },
    });
    customerId = customer.id;
    await prisma.subscription.update({ where: { companyId: company.id }, data: { stripeCustomerId: customerId } });
  }

  // An earlier open Checkout Session must be completed or expired before
  // another can be issued. Otherwise two completed sessions could create
  // two paid subscriptions before the first webhook updates our database.
  const previousSessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 100,
  });
  const pending = previousSessions.data.find(
    (previous) => previous.mode === "subscription" &&
      (previous.status === "open" || previous.status === "complete"),
  );
  if (pending) {
    return NextResponse.json(
      { error: "A subscription checkout is already open or pending reconciliation." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: basePrice.id, quantity: 1 },
  ];
  if (additionalSeats > 0) lineItems.push({ price: additionalPrice.id, quantity: additionalSeats });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    automatic_tax: { enabled: true },
    billing_address_collection: "required",
    customer_update: { address: "auto" },
    line_items: lineItems,
    success_url: `${redirectOrigin.replace(/\/$/, "")}/account?checkout=success`,
    cancel_url: `${redirectOrigin.replace(/\/$/, "")}/account?checkout=cancelled`,
    client_reference_id: company.id,
    metadata: { companyId: company.id, plan: company.plan, additionalSeats: String(additionalSeats) },
    subscription_data: { metadata: { companyId: company.id, plan: company.plan, additionalSeats: String(additionalSeats) } },
  });

  return NextResponse.json({
    url: checkout.url,
    plan: company.plan,
    billableSeats,
    includedSeats: plan.includedSeats,
    additionalSeats,
    basePriceMonthlyCents: plan.baseCents,
    seatPriceMonthlyCents: plan.additionalCents,
    monthlySubtotalCents: plan.baseCents + additionalSeats * plan.additionalCents,
  }, { headers: { "Cache-Control": "no-store" } });
}
