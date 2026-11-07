import {paidFeatureResponse} from "@/lib/billing";
import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {getSession} from "@/lib/auth";
const schema=z.object({status:z.enum(["DRAFT","SENT","PAID","VOID"])});
export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){const s=await getSession();if(!s)return NextResponse.json({error:"Authentication required."},{status:401});
 const subscriptionGate=await paidFeatureResponse(s);if(subscriptionGate)return subscriptionGate;if(!["OWNER","ADMIN","ACCOUNTING"].includes(s.role))return NextResponse.json({error:"Accounting permission required."},{status:403});const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:p.error.flatten()},{status:400});const found=await prisma.invoice.findFirst({where:{id:params.id,companyId:s.companyId}});if(!found)return NextResponse.json({error:"Invoice not found."},{status:404});const invoice=await prisma.invoice.update({where:{id:found.id},data:{status:p.data.status}});return NextResponse.json(invoice);}
