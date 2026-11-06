import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { createHash } from "crypto";
export async function rateLimit(req:NextRequest,scope:string,limit:number,windowSeconds:number){
 // Use a stable hash of the forwarded address plus scope; use a managed Redis limiter for multi-region production.
 const address=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const key=createHash("sha256").update(`${scope}:${address}`).digest("hex");
 const now=new Date();const resetAt=new Date(now.getTime()+windowSeconds*1000);
 try{
   const bucket=await prisma.rateLimitBucket.findUnique({where:{key}});
   if(!bucket||bucket.resetAt<=now){
     await prisma.rateLimitBucket.upsert({where:{key},create:{key,count:1,resetAt},update:{count:1,resetAt}});
     return {allowed:true,remaining:limit-1};
   }
   if(bucket.count>=limit)return {allowed:false,remaining:0,retryAfter:Math.max(1,Math.ceil((bucket.resetAt.getTime()-now.getTime())/1000))};
   await prisma.rateLimitBucket.update({where:{key},data:{count:{increment:1}}});
   return {allowed:true,remaining:limit-bucket.count-1};
 }catch{
   // Fail closed for authentication-sensitive throttling if persistence is unavailable.
   return {allowed:false,remaining:0,retryAfter:30};
 }
}
export function rateLimitResponse(retryAfter:number){
 return Response.json({error:"Too many requests. Please try again later."},{status:429,headers:{"Retry-After":String(retryAfter),"Cache-Control":"no-store"}});
}
