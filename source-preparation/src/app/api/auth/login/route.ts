import { NextRequest,NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSession,sessionCookie } from "@/lib/auth";
import { rateLimit,rateLimitResponse } from "@/lib/security";
const schema=z.object({email:z.string().email(),password:z.string().min(1)});
export async function POST(req:NextRequest){
 const throttle=await rateLimit(req,"auth-login",8,900);if(!throttle.allowed)return rateLimitResponse(throttle.retryAfter||900);
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Email and password are required."},{status:400});
 const email=parsed.data.email.toLowerCase().trim();
 const user=await prisma.user.findFirst({where:{email},include:{company:true}});
 if(!user||!(await bcrypt.compare(parsed.data.password,user.passwordHash)))return NextResponse.json({error:"Invalid email or password."},{status:401});
 const token=await signSession({userId:user.id,companyId:user.companyId,role:user.role,email:user.email});
 const response=NextResponse.json({user:{id:user.id,name:user.name,email:user.email,role:user.role},company:{id:user.company.id,name:user.company.name}});
 response.cookies.set(sessionCookie(token));return response;
}
