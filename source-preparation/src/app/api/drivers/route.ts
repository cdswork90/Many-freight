import {paidFeatureResponse} from "@/lib/billing";
import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {getSession} from "@/lib/auth";
const schema=z.object({name:z.string().min(2).max(120),phone:z.string().max(40).optional(),licenseNumber:z.string().max(100).optional(),active:z.boolean().optional()});
export async function GET(){const s=await getSession();if(!s)return NextResponse.json({error:"Authentication required."},{status:401});
 const subscriptionGate=await paidFeatureResponse(s);if(subscriptionGate)return subscriptionGate;if(s.role==="CUSTOMER")return NextResponse.json({error:"Forbidden."},{status:403});return NextResponse.json(await prisma.driver.findMany({where:s.role==="DRIVER"?{companyId:s.companyId,userId:s.userId}:{companyId:s.companyId},orderBy:{name:"asc"}}));}
export async function POST(req:NextRequest){const s=await getSession();if(!s)return NextResponse.json({error:"Authentication required."},{status:401});
 const subscriptionGate=await paidFeatureResponse(s);if(subscriptionGate)return subscriptionGate;if(!["OWNER","ADMIN","DISPATCHER"].includes(s.role))return NextResponse.json({error:"Forbidden."},{status:403});const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:p.error.flatten()},{status:400});const d=p.data;const driver=await prisma.driver.create({data:{companyId:s.companyId,name:d.name,phone:d.phone||null,licenseNumber:d.licenseNumber||null,active:d.active??true}});return NextResponse.json(driver,{status:201});}
