export const dynamic="force-dynamic";
import { NextResponse } from "next/server";
import { getSession,companySubscription } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(){const s=await getSession();if(!s)return NextResponse.json({user:null},{status:401});const [user,subscription]=await Promise.all([prisma.user.findUnique({where:{id:s.userId},select:{id:true,name:true,email:true,role:true,company:{select:{id:true,name:true}}}}),companySubscription(s.companyId)]);if(!user)return NextResponse.json({user:null},{status:401});return NextResponse.json({user,subscription});}
