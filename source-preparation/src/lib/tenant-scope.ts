/**
 * Scope operational queries to the authenticated company.
 * Driver and customer portal users are further limited to linked records.
 * Company-level BROKER and CARRIER plans share the same isolation boundary.
 */
export type TenantSession = {
  companyId: string;
  userId: string;
  role: string;
};

export function shipmentScope(session: TenantSession) {
  return {
    companyId: session.companyId,
    ...(session.role === "DRIVER" ? { driver: { userId: session.userId } } : {}),
    ...(session.role === "CUSTOMER" ? { customer: { userId: session.userId } } : {}),
  };
}

export function appointmentScope(session: TenantSession) {
  return {
    companyId: session.companyId,
    ...(session.role === "DRIVER" ? { driver: { userId: session.userId } } : {}),
    ...(session.role === "CUSTOMER" ? { customer: { userId: session.userId } } : {}),
  };
}
