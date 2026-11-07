import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession,sessionCookie } from "@/lib/auth";
import { rateLimit,rateLimitResponse } from "@/lib/security";
const schema=z.object({companyName:z.string().min(2).max(120),plan:z.literal("CARRIER").default("CARRIER"),name:z.string().min(2).max(100),email:z.string().email().max(254),password:z.string().min(12).max(128)});
export async function POST(req:NextRequest){
 const throttle=await rateLimit(req,"auth-register",5,900);if(!throttle.allowed)return rateLimitResponse(throttle.retryAfter||900);
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Invalid registration fields. Password must be at least 12 characters."},{status:400});
 const {companyName,plan,name,email,password}=parsed.data;const normalized=email.toLowerCase().trim();
 const existing=await prisma.user.findFirst({where:{email:normalized}});
 if(existing)return NextResponse.json({error:"An account with this email already exists."},{status:409});
 const passwordHash=await bcrypt.hash(password,12);
 const company=await prisma.company.create({data:{name:companyName,plan,users:{create:{name,email:normalized,passwordHash,role:"OWNER"}},subscription:{create:{status:"INCOMPLETE"}}},include:{users:true}});
 const user=company.users[0];const token=await signSession({userId:user.id,companyId:company.id,role:user.role,email:user.email});
 const response=NextResponse.json({user:{id:user.id,name:user.name,email:user.email,role:user.role},company:{id:company.id,name:company.name,plan:company.plan},subscription:{status:"INCOMPLETE"}},{status:201});
 response.cookies.set(sessionCookie(token));return response;
}
