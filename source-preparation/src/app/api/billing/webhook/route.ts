import { NextRequest,NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
function status(s:Stripe.Subscription["status"]):"INCOMPLETE"|"TRIALING"|"ACTIVE"|"PAST_DUE"|"CANCELED"|"UNPAID"{
 if(s==="trialing")return "TRIALING";if(s==="active")return "ACTIVE";if(s==="past_due")return "PAST_DUE";if(s==="canceled")return "CANCELED";if(s==="unpaid")return "UNPAID";return "INCOMPLETE";
}
export async function POST(req:NextRequest){
 if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)return NextResponse.json({error:"Webhook not configured."},{status:503});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const sig=req.headers.get("stripe-signature");if(!sig)return NextResponse.json({error:"Missing signature."},{status:400});
 const body=await req.text();let event:Stripe.Event;
 try{event=stripe.webhooks.constructEvent(body,sig,process.env.STRIPE_WEBHOOK_SECRET);}catch{return NextResponse.json({error:"Invalid signature."},{status:400});}
 const obj=event.data.object as any;
 if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)){
   const sub=obj as Stripe.Subscription;const companyId=sub.metadata?.companyId;
   if(companyId)await prisma.subscription.upsert({where:{companyId},create:{companyId,stripeCustomerId:String(sub.customer),stripeSubscriptionId:sub.id,stripePriceId:sub.items.data[0]?.price.id,status:status(sub.status),currentPeriodEnd:new Date(sub.current_period_end*1000),cancelAtPeriodEnd:sub.cancel_at_period_end},update:{stripeCustomerId:String(sub.customer),stripeSubscriptionId:sub.id,stripePriceId:sub.items.data[0]?.price.id,status:status(sub.status),currentPeriodEnd:new Date(sub.current_period_end*1000),cancelAtPeriodEnd:sub.cancel_at_period_end}});
 }
 if(event.type==="checkout.session.completed"&&obj.metadata?.companyId&&obj.subscription){
   const stripeSub=await stripe.subscriptions.retrieve(String(obj.subscription));const companyId=String(obj.metadata.companyId);
   await prisma.subscription.upsert({where:{companyId},create:{companyId,stripeCustomerId:String(obj.customer),stripeSubscriptionId:stripeSub.id,stripePriceId:stripeSub.items.data[0]?.price.id,status:status(stripeSub.status),currentPeriodEnd:new Date(stripeSub.current_period_end*1000)},update:{stripeCustomerId:String(obj.customer),stripeSubscriptionId:stripeSub.id,stripePriceId:stripeSub.items.data[0]?.price.id,status:status(stripeSub.status),currentPeriodEnd:new Date(stripeSub.current_period_end*1000)}});
 }
 return NextResponse.json({received:true});
}
