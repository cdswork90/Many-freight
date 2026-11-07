import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const noStore = { "Cache-Control": "no-store" };
function response(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}
function subscriptionStatus(value: Stripe.Subscription.Status):
  "INCOMPLETE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" {
  switch (value) {
    case "trialing": return "TRIALING";
    case "active": return "ACTIVE";
    case "past_due": return "PAST_DUE";
    case "canceled": return "CANCELED";
    case "unpaid": return "UNPAID";
    default: return "INCOMPLETE";
  }
}
function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer) {
  return typeof value === "string" ? value : value.id;
}
async function updateAuthorizedSubscription(sub: Stripe.Subscription, claimedCompanyId: string) {
  if (!claimedCompanyId) return false;
  const record = await prisma.subscription.findUnique({ where: { companyId: claimedCompanyId } });
  if (!record || !record.stripeCustomerId) return false;
  // A signed Stripe event is authentic, but its subscription metadata is not
  // authorization to change an arbitrary company's billing record.
  if (record.stripeCustomerId !== customerId(sub.customer)) return false;
  // Do not permit events for a different subscription to overwrite a subscription.
  if (record.stripeSubscriptionId && record.stripeSubscriptionId !== sub.id) return false;
  await prisma.subscription.update({
    where: { companyId: claimedCompanyId },
    data: {
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price.id ?? null,
      status: subscriptionStatus(sub.status),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
  return true;
}

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key?.startsWith("sk_test_") || !secret)
    return response({ error: "Stripe test webhook not configured." }, 503);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return response({ error: "Missing signature." }, 400);
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(key);
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
    if (event.livemode) return response({ error: "Live billing is disabled." }, 403);

    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object as Stripe.Checkout.Session;
      if (checkout.mode !== "subscription" || typeof checkout.subscription !== "string")
        return response({ received: true });
      const sub = await stripe.subscriptions.retrieve(checkout.subscription);
      const claimedCompanyId = checkout.metadata?.companyId ?? "";
      // Checkout company ID and subscription company ID must agree.
      if (sub.metadata?.companyId !== claimedCompanyId ||
          customerId(sub.customer) !== (typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id))
        return response({ error: "Stripe subscription ownership mismatch." }, 409);
      if (!await updateAuthorizedSubscription(sub, claimedCompanyId))
        return response({ error: "Subscription customer mismatch." }, 409);
    }

    if (event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.deleted") {
      const fromEvent = event.data.object as Stripe.Subscription;
      // Re-fetch active subscriptions to avoid replaying a stale status update.
      // Deleted subscriptions use the signed final object.
      const sub = event.type === "customer.subscription.deleted"
        ? fromEvent : await stripe.subscriptions.retrieve(fromEvent.id);
      if (!await updateAuthorizedSubscription(sub, sub.metadata?.companyId ?? ""))
        return response({ error: "Subscription customer mismatch." }, 409);
    }
    return response({ received: true });
  } catch (error) {
    // Never acknowledge an event that cannot be verified or persisted.
    if (error instanceof Stripe.errors.StripeSignatureVerificationError)
      return response({ error: "Invalid signature." }, 400);
    console.error("Stripe webhook processing failed", error instanceof Error ? error.name : "unknown");
    return response({ error: "Webhook processing failed." }, 500);
  }
}
