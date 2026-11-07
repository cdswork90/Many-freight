import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
const cookieName = "ttpro_session";
const authSecret = process.env.AUTH_SECRET || "development-only-secret-change-this-before-launch";
function assertAuthSecret(){if(process.env.NODE_ENV==="production"&&(!process.env.AUTH_SECRET||process.env.AUTH_SECRET.length<32))throw new Error("AUTH_SECRET must be at least 32 characters in production.");}
const secret = new TextEncoder().encode(authSecret);
export type SessionUser = { userId:string; companyId:string; role:string; email:string };
export async function signSession(user:SessionUser) {
  assertAuthSecret();
  return new SignJWT(user).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(secret);
}
export async function getSession():Promise<SessionUser|null>{
  assertAuthSecret();
  const token=cookies().get(cookieName)?.value;
  if(!token)return null;
  try { const {payload}=await jwtVerify(token,secret); if(!payload.userId||!payload.companyId||!payload.role||!payload.email)return null;
    // A valid signed cookie alone is not sufficient: roles and company membership
    // can change before the seven-day token expires.
    const userId = String(payload.userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, companyId: true, role: true, email: true },
    });
    if (!user || user.companyId !== String(payload.companyId) ||
        user.role !== String(payload.role) || user.email !== String(payload.email)) return null;
    return {userId:user.id,companyId:user.companyId,role:user.role,email:user.email};
  } catch{return null;}
}
export function sessionCookie(token:string){return {name:cookieName,value:token,httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/",maxAge:60*60*24*7};}
export async function requireSession(){const session=await getSession();if(!session)throw new Error("UNAUTHENTICATED");return session;}
export async function requireRole(roles:string[]){const s=await requireSession();if(!roles.includes(s.role))throw new Error("FORBIDDEN");return s;}
export async function companySubscription(companyId:string){
  return prisma.subscription.findUnique({where:{companyId}});
}
