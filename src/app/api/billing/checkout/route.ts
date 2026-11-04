import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(){
 const session=await getSession();if(!session)return NextResponse.json({error:"Sign in required."},{status:401});
 if(!["OWNER","ADMIN"].includes(session.role))return NextResponse.json({error:"Only company owners or admins can manage billing."},{status:403});
 if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_PRICE_ID)return NextResponse.json({error:"Billing is not configured. Set Stripe secret and price IDs."},{status:503});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
 const company=await prisma.company.findUnique({where:{id:session.companyId}});
 const sub=await prisma.subscription.findUnique({where:{companyId:session.companyId}});
 if(!company||!sub)return NextResponse.json({error:"Company billing profile missing."},{status:404});
 let customerId=sub.stripeCustomerId;
 if(!customerId){const customer=await stripe.customers.create({name:company.name,email:session.email,metadata:{companyId:company.id}});customerId=customer.id;await prisma.subscription.update({where:{companyId:company.id},data:{stripeCustomerId:customerId}});}
 const checkout=await stripe.checkout.sessions.create({mode:"subscription",customer:customerId,line_items:[{price:process.env.STRIPE_PRICE_ID,quantity:1}],success_url:process.env.STRIPE_SUCCESS_URL||`${process.env.APP_URL}/account?checkout=success`,cancel_url:process.env.STRIPE_CANCEL_URL||`${process.env.APP_URL}/account?checkout=cancelled`,client_reference_id:company.id,metadata:{companyId:company.id},subscription_data:{metadata:{companyId:company.id}}});
 return NextResponse.json({url:checkout.url});
}
