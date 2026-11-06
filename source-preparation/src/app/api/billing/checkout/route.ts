import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Extra seats are additional internal user logins beyond the company owner.
// Customer portal logins do not count as paid dispatch/driver seats.
const paidSeatRoles = ["ADMIN", "DISPATCHER", "DRIVER", "ACCOUNTING"] as const;

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.role))
    return NextResponse.json({ error: "Only company owners or admins can manage billing." }, { status: 403 });

  // This review branch must not create live Stripe checkout sessions.
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_"))
    return NextResponse.json({ error: "Only Stripe test-mode checkout is enabled." }, { status: 503 });
  if (!process.env.STRIPE_PRICE_ID || !process.env.STRIPE_ADDITIONAL_DRIVER_PRICE_ID)
    return NextResponse.json({ error: "Base and additional-seat test prices must both be configured." }, { status: 503 });
  if (!process.env.APP_URL)
    return NextResponse.json({ error: "APP_URL is required for checkout redirects." }, { status: 503 });

  const stripe = new Stripe(key);
  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  const sub = await prisma.subscription.findUnique({ where: { companyId: session.companyId } });
  if (!company || !sub) return NextResponse.json({ error: "Company billing profile missing." }, { status: 404 });
  if (sub.stripeSubscriptionId)
    return NextResponse.json({ error: "A subscription already exists; manage seat changes in the billing portal once implemented." }, { status: 409 });

  const basePrice = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
  const seatPrice = await stripe.prices.retrieve(process.env.STRIPE_ADDITIONAL_DRIVER_PRICE_ID);
  const monthly = (p: Stripe.Price) => p.active && !p.livemode && p.currency === "usd" &&
    p.type === "recurring" && p.recurring?.interval === "month" && p.recurring.interval_count === 1;
  if (!monthly(basePrice) || !monthly(seatPrice) || seatPrice.unit_amount !== 4995 ||
      basePrice.id === seatPrice.id)
    return NextResponse.json({ error: "Stripe test prices are not configured for monthly base + $49.95 seats." }, { status: 503 });

  const additionalSeats = await prisma.user.count({
    where: { companyId: session.companyId, role: { in: [...paidSeatRoles] } },
  });

  let customerId = sub.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: company.name, email: session.email,
      metadata: { companyId: company.id, product: "many-freight" },
    });
    customerId = customer.id;
    await prisma.subscription.update({ where: { companyId: company.id }, data: { stripeCustomerId: customerId } });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: basePrice.id, quantity: 1 },
  ];
  if (additionalSeats > 0) lineItems.push({ price: seatPrice.id, quantity: additionalSeats });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: lineItems,
    success_url: `${process.env.APP_URL}/account?checkout=success`,
    cancel_url: `${process.env.APP_URL}/account?checkout=cancelled`,
    client_reference_id: company.id,
    metadata: { companyId: company.id, additionalSeats: String(additionalSeats) },
    subscription_data: { metadata: { companyId: company.id, additionalSeats: String(additionalSeats) } },
  });
  return NextResponse.json({ url: checkout.url, additionalSeats, seatPriceMonthlyCents: 4995 }, {
    headers: { "Cache-Control": "no-store" },
  });
}
