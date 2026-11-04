import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(){
 const s=await getSession();if(!s)return NextResponse.json({error:"Sign in required."},{status:401});
 if(!["OWNER","ADMIN"].includes(s.role))return NextResponse.json({error:"Billing permission required."},{status:403});
 if(!process.env.STRIPE_SECRET_KEY)return NextResponse.json({error:"Billing is not configured."},{status:503});
 const sub=await prisma.subscription.findUnique({where:{companyId:s.companyId}});
 if(!sub?.stripeCustomerId)return NextResponse.json({error:"No billing customer exists yet."},{status:404});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
 const portal=await stripe.billingPortal.sessions.create({customer:sub.stripeCustomerId,return_url:`${process.env.APP_URL}/account`});
 return NextResponse.json({url:portal.url});
}
