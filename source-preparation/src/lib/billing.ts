import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/lib/auth";
export type PaidFeature="LOAD_BOARD"|"GPS_LIVE"|"REPORTS_EXPORT"|"ADVANCED_DISPATCH";
const entitledStatuses=["ACTIVE","TRIALING"];
export async function checkPaidAccess(session:SessionUser){
 const subscription=await prisma.subscription.findUnique({where:{companyId:session.companyId}});
 // Fail closed: a paid or trialing status without a known future period end\n // must never grant indefinite access if a webhook was incomplete.\n const active=!!subscription && entitledStatuses.includes(subscription.status) &&\n   !!subscription.stripeSubscriptionId && !!subscription.currentPeriodEnd &&\n   subscription.currentPeriodEnd>new Date();
 return {active,status:subscription?.status??"INCOMPLETE",subscription};
}
export async function paidFeatureResponse(session:SessionUser){
 const access=await checkPaidAccess(session);
 if(access.active)return null;
 return Response.json({error:"An active subscription is required for this feature.",code:"SUBSCRIPTION_REQUIRED",subscriptionStatus:access.status},{status:402,headers:{"Cache-Control":"no-store"}});
}
