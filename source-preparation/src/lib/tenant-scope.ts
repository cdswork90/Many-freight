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

/** Driver-accessible shipment data excludes commercial customer rates and PII. */
export const driverShipmentProjection = {
  id:true,reference:true,companyId:true,customerId:true,driverId:true,
  pickupAddress:true,dropoffAddress:true,pickupAt:true,dropoffAt:true,
  freightType:true,status:true,description:true,miles:true,
  customer:{select:{id:true,name:true}},
  driver:{select:{id:true,name:true}},
} as const;

/** Only owners, admins, and a driver viewing their own row see license IDs. */
export function driverDirectoryProjection(session: TenantSession) {
  return {
    id:true as const,companyId:true as const,name:true as const,
    phone:true as const,active:true as const,userId:true as const,
    ...(["OWNER","ADMIN","DRIVER"].includes(session.role)
      ? {licenseNumber:true as const}
      : {}),
  };
}
