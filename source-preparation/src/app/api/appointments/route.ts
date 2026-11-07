import {NextRequest,NextResponse} from "next/server";import {z} from "zod";import {prisma} from "@/lib/prisma";import {getSession} from "@/lib/auth";
const schema=z.object({title:z.string().min(2).max(160),type:z.enum(["PICKUP","DELIVERY","SERVICE","INSPECTION","OTHER"]).default("OTHER"),startsAt:z.string().datetime(),endsAt:z.string().datetime().optional(),location:z.string().max(500).optional(),notes:z.string().max(2000).optional(),shipmentId:z.string().optional(),customerId:z.string().optional(),driverId:z.string().optional()});
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({error:"Authentication required."},{status:401});
  const where: any = { companyId: s.companyId };
  if (s.role === "DRIVER") where.driver = { userId: s.userId };
  if (s.role === "CUSTOMER") where.customer = { userId: s.userId };

  // Appointment viewers do not need linked Driver, Customer, or Shipment records.
  // Returning those complete relations would disclose unrelated personal and
  // financial data, including driver licensing information and shipment rates.
  const appointments = await prisma.appointment.findMany({
    where,
    select: {
      id: true,
      title: true,
      type: true,
      startsAt: true,
      endsAt: true,
      location: true,
      notes: true,
      status: true,
    },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json(appointments,{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(req:NextRequest){const s=await getSession();if(!s)return NextResponse.json({error:"Authentication required."},{status:401});if(!["OWNER","ADMIN","DISPATCHER"].includes(s.role))return NextResponse.json({error:"Forbidden."},{status:403});const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:p.error.flatten()},{status:400});const d=p.data;for(const [id,model] of [[d.shipmentId,"shipment"],[d.customerId,"customer"],[d.driverId,"driver"]] as const){if(id){const found=model==="shipment"?await prisma.shipment.findFirst({where:{id,companyId:s.companyId}}):model==="customer"?await prisma.customer.findFirst({where:{id,companyId:s.companyId}}):await prisma.driver.findFirst({where:{id,companyId:s.companyId}});if(!found)return NextResponse.json({error:`${model} not found in this company.`},{status:400});}}const item=await prisma.appointment.create({data:{companyId:s.companyId,title:d.title,type:d.type,startsAt:new Date(d.startsAt),endsAt:d.endsAt?new Date(d.endsAt):null,location:d.location||null,notes:d.notes||null,shipmentId:d.shipmentId||null,customerId:d.customerId||null,driverId:d.driverId||null}});return NextResponse.json(item,{status:201});}
