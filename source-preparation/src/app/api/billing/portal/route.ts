import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.role))
    return NextResponse.json({ error: "Only company owners or admins can manage billing." }, { status: 403 });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_"))
    return NextResponse.json({ error: "Only Stripe test-mode billing portal is enabled." }, { status: 503 });

  const baseUrl = process.env.APP_URL ||
    (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!baseUrl || !baseUrl.startsWith("https://"))
    return NextResponse.json({ error: "Secure billing return URL is missing." }, { status: 503 });

  const subscription = await prisma.subscription.findUnique({
    where: { companyId: session.companyId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });
  if (!subscription?.stripeCustomerId || !subscription.stripeSubscriptionId)
    return NextResponse.json({ error: "No verified subscription is available to manage." }, { status: 404 });

  const stripe = new Stripe(key);
  const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
  const stripeCustomerId =
    typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id;
  if (stripeSub.livemode || stripeCustomerId !== subscription.stripeCustomerId ||
      stripeSub.metadata?.companyId !== session.companyId)
    return NextResponse.json({ error: "Stripe subscription ownership mismatch." }, { status: 409 });

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${baseUrl.replace(/\\/$/, "")}/account`,
  });
  return NextResponse.json({ url: portal.url }, { headers: { "Cache-Control": "no-store" } });
}
