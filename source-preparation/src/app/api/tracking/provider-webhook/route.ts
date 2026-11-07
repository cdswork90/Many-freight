import { NextRequest,NextResponse } from "next/server";
import { timingSafeEqual,createHmac } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
const schema=z.object({companyId:z.string().min(1),shipmentId:z.string().min(1),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),note:z.string().max(300).optional()});
export async function POST(req:NextRequest){
 const secret=process.env.GPS_WEBHOOK_SECRET;if(!secret)return NextResponse.json({error:"GPS webhook is not configured."},{status:503});
 const raw=await req.text();const signature=req.headers.get("x-transtrack-signature")||"";
 const expected=createHmac("sha256",secret).update(raw).digest("hex");
 const a=Buffer.from(signature);const b=Buffer.from(expected);
 if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"Invalid webhook signature."},{status:401});
 let body:unknown;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});
 const d=parsed.data;const shipment=await prisma.shipment.findFirst({where:{id:d.shipmentId,companyId:d.companyId},select:{id:true}});
 if(!shipment)return NextResponse.json({error:"Shipment not found."},{status:404});
 const event=await prisma.trackingEvent.create({data:{shipmentId:d.shipmentId,latitude:d.latitude,longitude:d.longitude,note:d.note||"GPS provider update"}});
 return NextResponse.json({received:true,eventId:event.id},{status:201});
}
