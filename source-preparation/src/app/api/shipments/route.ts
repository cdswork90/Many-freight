import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
const CreateShipment=z.object({reference:z.string().min(1),pickupAddress:z.string().min(1),dropoffAddress:z.string().min(1),customerId:z.string().optional(),freightType:z.string().default("General Freight"),rateCents:z.number().int().nonnegative().default(0),description:z.string().optional()});
export async function GET(){
 const session=await getSession();if(!session)return NextResponse.json({error:"Authentication required."},{status:401});
 const where:any={companyId:session.companyId};if(session.role==="DRIVER")where.driver={userId:session.userId};if(session.role==="CUSTOMER")where.customer={userId:session.userId};
 const shipments=await prisma.shipment.findMany({where,include:{customer:{select:{id:true,name:true,phone:true}},driver:{select:{id:true,name:true}}},orderBy:{createdAt:"desc"}});
 return NextResponse.json(shipments);
}
export async function POST(req:NextRequest){
 const session=await getSession();if(!session)return NextResponse.json({error:"Authentication required."},{status:401});
 if(!["OWNER","ADMIN","DISPATCHER"].includes(session.role))return NextResponse.json({error:"Insufficient role permissions."},{status:403});
 const parsed=CreateShipment.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});
 const data=parsed.data;
 if(data.customerId){const customer=await prisma.customer.findFirst({where:{id:data.customerId,companyId:session.companyId}});if(!customer)return NextResponse.json({error:"Customer not found in this company."},{status:400});}
 const shipment=await prisma.shipment.create({data:{...data,companyId:session.companyId}});
 return NextResponse.json(shipment,{status:201});
}
