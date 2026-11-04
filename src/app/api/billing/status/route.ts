export const dynamic="force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkPaidAccess } from "@/lib/billing";
export async function GET(){const s=await getSession();if(!s)return NextResponse.json({error:"Authentication required."},{status:401});const access=await checkPaidAccess(s);return NextResponse.json({active:access.active,status:access.status,periodEnd:access.subscription?.currentPeriodEnd??null,cancelAtPeriodEnd:access.subscription?.cancelAtPeriodEnd??false});}
