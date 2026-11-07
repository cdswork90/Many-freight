import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/lib/auth";

export type PaidFeature = "LOAD_BOARD" | "GPS_LIVE" | "REPORTS_EXPORT" | "ADVANCED_DISPATCH";
// Unpaid Stripe trials must not unlock real operational data.
const entitledStatuses = ["ACTIVE"];

export async function checkPaidAccess(session: SessionUser) {
  const subscription = await prisma.subscription.findUnique({
    where: { companyId: session.companyId },
  });
  // A paid or trialing status is insufficient without a verified subscription
  // identity and an unexpired period end. Fail closed if either is missing.
  const active = !!subscription &&
    entitledStatuses.includes(subscription.status) &&
    !!subscription.stripeSubscriptionId &&
    !!subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd > new Date();
  return { active, status: subscription?.status ?? "INCOMPLETE", subscription };
}

export async function paidFeatureResponse(session: SessionUser) {
  const access = await checkPaidAccess(session);
  if (access.active) return null;
  return Response.json({
    error: "An active subscription is required for this feature.",
    code: "SUBSCRIPTION_REQUIRED",
    subscriptionStatus: access.status,
  }, { status: 402, headers: { "Cache-Control": "no-store" } });
}
