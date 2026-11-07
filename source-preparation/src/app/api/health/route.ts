import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {isSessionSigningConfigured} from "@/lib/launch-readiness";

export const dynamic="force-dynamic";

export async function GET(){
 const noStore={"Cache-Control":"no-store"};
 const checkedAt=new Date().toISOString();
 // Authentication is a required production capability. A functioning
 // database connection alone must not make a broken login system look healthy.
 if(!isSessionSigningConfigured(process.env.AUTH_SECRET,process.env.NODE_ENV==="production")){
   return NextResponse.json({
     status:"degraded",service:"many-freight",database:"not_checked",timestamp:checkedAt
   },{status:503,headers:noStore});
 }
 try{
   await prisma.$queryRaw`SELECT 1`;
   return NextResponse.json({
     status:"ok",service:"many-freight",database:"connected",timestamp:checkedAt
   },{headers:noStore});
 }catch{
   return NextResponse.json({
     status:"degraded",service:"many-freight",database:"unavailable",timestamp:checkedAt
   },{status:503,headers:noStore});
 }
}
