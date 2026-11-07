"use client";
import { useEffect, useState } from "react";

type AccountInfo = {
  user: {
    name: string;
    email: string;
    role: string;
    company: { name: string; plan: "CARRIER" | "BROKER" };
  };
  subscription?: {
    status?: string;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  } | null;
};

const planInfo = {
  CARRIER: { label: "Carrier", base: "$49.95", included: 1, seat: "$24.95" },
  BROKER: { label: "Broker", base: "$139.95", included: 2, seat: "$75.95" },
};
export default function Account() {
  const [data, setData] = useState<AccountInfo | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw Error("Sign in to access your account.");
        return response.json();
      }).then(setData).catch((error: Error) => setErr(error.message));
  }, []);

  async function action(endpoint: string) {
    if (busy) return;
    setBusy(true); setErr("");
    try {
      const response = await fetch(endpoint, { method: "POST", cache: "no-store" });
      const value = await response.json();
      if (!response.ok || typeof value.url !== "string") {
        throw Error(value.error || "Billing request failed.");
      }
      const redirect = new URL(value.url);
      if (redirect.protocol !== "https:" || !redirect.hostname.endsWith(".stripe.com")) {
        throw Error("Unexpected billing destination.");
      }
      location.assign(redirect.toString());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Billing request failed.");
      setBusy(false);
    }
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/register";
  }

  const plan = data ? planInfo[data.user.company.plan] : null;
  const canManage = data && ["OWNER", "ADMIN"].includes(data.user.role);
  const hasSubscription = !!data?.subscription?.stripeSubscriptionId;
  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 20 }}>
      <div className="panel">
        <h1>Company Account</h1>
        {err && <p role="alert" style={{ color: "#ff8888" }}>{err}</p>}
        {data && (
          <>
            <h2>{data.user.company.name}</h2>
            <p>{data.user.name} · {data.user.email} · {data.user.role}</p>
            {plan && <p><strong>{plan.label} plan</strong>: {plan.base} per month includes {plan.included} seat{plan.included === 1 ? "" : "s"}; {plan.seat} per additional seat per month, plus applicable tax.</p>}
            <p>Subscription status: <strong>{data.subscription?.status || "Not configured"}</strong></p>
            <p>Current period ends: {data.subscription?.currentPeriodEnd
              ? new Date(data.subscription.currentPeriodEnd).toLocaleDateString()
              : "—"}</p>
            {data.subscription?.cancelAtPeriodEnd && <p>Cancellation is scheduled at the end of the current billing period.</p>}
            <p>Billing integration is in TEST MODE. No real customer payments are enabled.</p>
            <div className="actions">
              {canManage && !hasSubscription &&
                <button className="btn primary" disabled={busy}
                  onClick={() => action("/api/billing/checkout")}>Start test subscription</button>}
              {canManage && hasSubscription &&
                <button className="btn" disabled={busy}
                  onClick={() => action("/api/billing/portal")}>Manage test billing / cancel</button>}
              <button className="btn" onClick={logout}>Sign out</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
