import {paidFeatureResponse} from "@/lib/billing";
import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import bcrypt from "bcryptjs";
import {prisma} from "@/lib/prisma";
import {getSession} from "@/lib/auth";
const schema=z.object({name:z.string().min(2).max(100),email:z.string().email().max(254),password:z.string().min(12).max(128)});
export async function POST(req:NextRequest,{params}:{params:{id:string}}){
 const s=await getSession();if(!s)return NextResponse.json({error:"Authentication required."},{status:401});
 const subscriptionGate=await paidFeatureResponse(s);if(subscriptionGate)return subscriptionGate;
 if(!["OWNER","ADMIN"].includes(s.role))return NextResponse.json({error:"Only company owners and admins can invite customer portal users."},{status:403});
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Provide a name, valid email, and password of at least 12 characters."},{status:400});
 const customer=await prisma.customer.findFirst({where:{id:params.id,companyId:s.companyId}});if(!customer)return NextResponse.json({error:"Customer not found."},{status:404});if(customer.userId)return NextResponse.json({error:"This customer already has portal access."},{status:409});
 const email=parsed.data.email.toLowerCase().trim();if(await prisma.user.findUnique({where:{email}}))return NextResponse.json({error:"This email is already registered."},{status:409});
 const passwordHash=await bcrypt.hash(parsed.data.password,12);const user=await prisma.user.create({data:{companyId:s.companyId,name:parsed.data.name,email,passwordHash,role:"CUSTOMER"}});
 await prisma.customer.update({where:{id:customer.id},data:{userId:user.id}});
 return NextResponse.json({id:user.id,name:user.name,email:user.email,role:user.role},{status:201});
}
