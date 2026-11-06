/**
 * Freight provider adapter contracts.
 * Real provider access requires approved API credentials, provider-specific endpoints,
 * OAuth/signature rules, and permission to use their data.
 */
export type FreightLoad={provider:string;externalId:string;origin:string;destination:string;pickupDate?:string;deliveryDate?:string;equipment?:string;rateCents?:number;notes?:string};
export interface FreightConnector{
 provider:"SUPER_DISPATCH"|"CENTRAL_DISPATCH";
 searchLoads(input:{origin?:string;destination?:string;equipment?:string;pickupAfter?:string}):Promise<FreightLoad[]>;
}
export class ProviderNotConfigured extends Error{
 constructor(provider:string){super(`${provider} integration is not configured. Add authorized provider credentials and implement its documented API adapter.`);}
}
export class SuperDispatchConnector implements FreightConnector{
 provider="SUPER_DISPATCH" as const;
 async searchLoads(_input:{origin?:string;destination?:string;equipment?:string;pickupAfter?:string}):Promise<FreightLoad[]>{
  if(!process.env.SUPER_DISPATCH_API_BASE_URL||!process.env.SUPER_DISPATCH_ACCESS_TOKEN)throw new ProviderNotConfigured(this.provider);
  // Placeholder intentionally refuses to guess undocumented API paths or authentication contracts.
  throw new ProviderNotConfigured(`${this.provider} adapter endpoint mapping`);
 }
}
export class CentralDispatchConnector implements FreightConnector{
 provider="CENTRAL_DISPATCH" as const;
 async searchLoads(_input:{origin?:string;destination?:string;equipment?:string;pickupAfter?:string}):Promise<FreightLoad[]>{
  if(!process.env.CENTRAL_DISPATCH_API_BASE_URL||!process.env.CENTRAL_DISPATCH_ACCESS_TOKEN)throw new ProviderNotConfigured(this.provider);
  throw new ProviderNotConfigured(`${this.provider} adapter endpoint mapping`);
 }
}
export function getFreightConnector(provider:string):FreightConnector{
 if(provider==="SUPER_DISPATCH")return new SuperDispatchConnector();
 if(provider==="CENTRAL_DISPATCH")return new CentralDispatchConnector();
 throw new Error("Unsupported freight provider.");
}
