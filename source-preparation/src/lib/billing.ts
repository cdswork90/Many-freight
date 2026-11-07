import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/lib/auth";
import { hasPaidOperationalAccess } from "@/lib/subscription-entitlement";

export type PaidFeature = "LOAD_BOARD" | "GPS_LIVE" | "REPORTS_EXPORT" | "ADVANCED_DISPATCH";

export async function checkPaidAccess(session: SessionUser) {
  const subscription = await prisma.subscription.findUnique({
    where: { companyId: session.companyId },
  });
  // Only an unexpired, verified ACTIVE subscription can access live data.
  // TRIALING and all other statuses remain restricted to billing/demo flows.
  const active = hasPaidOperationalAccess(subscription);
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
