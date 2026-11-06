import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { paidFeatureResponse } from "@/lib/billing";
import { rateLimit,rateLimitResponse } from "@/lib/security";
const schema=z.object({shipmentId:z.string().min(1),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),note:z.string().max(300).optional()});
export async function GET(req:NextRequest){
 const s=await getSession();if(!s)return NextResponse.json({error:"Authentication required."},{status:401});
 const gate=await paidFeatureResponse(s);if(gate)return gate;
 const shipmentId=req.nextUrl.searchParams.get("shipmentId");if(!shipmentId)return NextResponse.json({error:"shipmentId required."},{status:400});
 const shipment=await prisma.shipment.findFirst({where:{id:shipmentId,companyId:s.companyId},select:{id:true,reference:true,status:true}});
 if(!shipment)return NextResponse.json({error:"Shipment not found."},{status:404});
 const events=await prisma.trackingEvent.findMany({where:{shipmentId},orderBy:{recordedAt:"desc"},take:100});
 return NextResponse.json({shipment,events});
}
export async function POST(req:NextRequest){
 const s=await getSession();if(!s)return NextResponse.json({error:"Authentication required."},{status:401});
 if(!["OWNER","ADMIN","DISPATCHER","DRIVER"].includes(s.role))return NextResponse.json({error:"Insufficient permissions."},{status:403});
 const gate=await paidFeatureResponse(s);if(gate)return gate;
 const throttle=await rateLimit(req,"tracking-update",120,60);if(!throttle.allowed)return rateLimitResponse(throttle.retryAfter||60);
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});
 const data=parsed.data;const shipment=await prisma.shipment.findFirst({where:{id:data.shipmentId,companyId:s.companyId},select:{id:true}});
 if(!shipment)return NextResponse.json({error:"Shipment not found in this company."},{status:404});
 const event=await prisma.trackingEvent.create({data:{shipmentId:data.shipmentId,latitude:data.latitude,longitude:data.longitude,note:data.note}});
 return NextResponse.json(event,{status:201});
}
