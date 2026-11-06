import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { paidFeatureResponse } from "@/lib/billing";
import { rateLimit,rateLimitResponse } from "@/lib/security";
import { getFreightConnector,ProviderNotConfigured } from "@/lib/freight/connectors";
const schema=z.object({provider:z.enum(["SUPER_DISPATCH","CENTRAL_DISPATCH"]),origin:z.string().max(120).optional(),destination:z.string().max(120).optional(),equipment:z.string().max(80).optional(),pickupAfter:z.string().max(40).optional()});
export async function POST(req:NextRequest){
 const s=await getSession();if(!s)return NextResponse.json({error:"Authentication required."},{status:401});
 if(!["OWNER","ADMIN","DISPATCHER"].includes(s.role))return NextResponse.json({error:"Insufficient permissions."},{status:403});
 const throttle=await rateLimit(req,"freight-search",30,60);if(!throttle.allowed)return rateLimitResponse(throttle.retryAfter||60);
 const gate=await paidFeatureResponse(s);if(gate)return gate;
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});
 try{const {provider,...filters}=parsed.data;const loads=await getFreightConnector(provider).searchLoads(filters);return NextResponse.json({provider,loads});}
 catch(e){if(e instanceof ProviderNotConfigured)return NextResponse.json({error:e.message,code:"PROVIDER_NOT_CONFIGURED"},{status:503});return NextResponse.json({error:"Freight provider request failed."},{status:502});}
}
