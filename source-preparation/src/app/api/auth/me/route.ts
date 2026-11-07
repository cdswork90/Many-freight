import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, company: { select: { id: true, name: true, plan: true } } },
  });
  if (!user) return NextResponse.json({ user: null }, { status: 401, headers: { "Cache-Control": "no-store" } });

  // Billing details are company administration data, not general session data.
  const canViewBilling = session.role === "OWNER" || session.role === "ADMIN";
  const subscription = canViewBilling
    ? await prisma.subscription.findUnique({
        where: { companyId: session.companyId },
        select: {
          status: true,
          stripeSubscriptionId: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      })
    : null;

  return NextResponse.json({ user, subscription }, { headers: { "Cache-Control": "no-store" } });
}
