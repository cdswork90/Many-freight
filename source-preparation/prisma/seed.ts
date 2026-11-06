import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
async function main(){
 const company=await prisma.company.upsert({where:{id:"demo-company"},update:{},create:{id:"demo-company",name:"Demo Logistics",email:"ops@example.com"}});
 const customer=await prisma.customer.upsert({where:{id:"demo-customer"},update:{},create:{id:"demo-customer",companyId:company.id,name:"John Doe Logistics",phone:"(555) 123-4567",email:"john@example.com"}});
 await prisma.shipment.upsert({where:{companyId_reference:{companyId:company.id,reference:"1047"}},update:{},create:{companyId:company.id,customerId:customer.id,reference:"1047",status:"IN_TRANSIT",pickupAddress:"Dallas, TX",dropoffAddress:"Houston, TX",freightType:"Vehicle",rateCents:125000}});
 console.log("Seeded demo company and shipment.");
}
main().finally(()=>prisma.$disconnect());
