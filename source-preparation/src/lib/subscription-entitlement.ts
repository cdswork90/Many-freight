/**
 * Fail-closed authorization for real carrier and broker operations.
 * Demo previews must use synthetic data outside authenticated live APIs.
 */
export type OperationalSubscription = {
  status: string;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
} | null;

export function hasPaidOperationalAccess(
  subscription: OperationalSubscription,
  now: Date = new Date(),
): boolean {
  if (!subscription || subscription.status !== "ACTIVE") return false;
  if (!subscription.stripeSubscriptionId?.startsWith("sub_")) return false;
  const end = subscription.currentPeriodEnd;
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return false;
  return end.getTime() > now.getTime();
}
