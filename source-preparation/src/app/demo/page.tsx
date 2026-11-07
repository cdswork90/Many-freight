"use client";
import { useMemo, useState, type FormEvent } from "react";
import { demoShipments, money } from "@/lib/demo";

type DemoLoad = (typeof demoShipments)[number];
type DemoPlan = "CARRIER" | "BROKER";

const panel = {
  background: "#0b1524", border: "1px solid #26405b",
  borderRadius: 16, padding: 18, marginTop: 16,
} as const;

export default function DemoPage() {
  // Everything below is local browser state. No live API or database is used.
  const [plan, setPlan] = useState<DemoPlan>("CARRIER");
  const [loads, setLoads] = useState<DemoLoad[]>(() => demoShipments.map(load => ({ ...load })));
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const filtered = useMemo(() => loads.filter(load =>
    [load.reference, load.customerName, load.pickupAddress, load.dropoffAddress, load.status]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  ), [loads, search]);

  function updateStatus(id: string, status: string) {
    setLoads(previous => previous.map(load =>
      load.id === id ? { ...load, status } : load
    ));
  }

  function addSampleLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    const number = String(1048 + loads.length - demoShipments.length);
    setLoads(previous => [{
      id: "sample-" + number,
      reference: number,
      customerName: "Sample Customer (Demo Only)",
      pickupAddress: origin.trim(),
      dropoffAddress: destination.trim(),
      status: "BOOKED",
      rateCents: 0,
      driverName: "Unassigned",
      freightType: "General Freight",
    }, ...previous]);
    setOrigin(""); setDestination("");
  }

  return <main style={{maxWidth:1120,margin:"0 auto",padding:"28px 18px 56px",color:"#eaf4ff"}}>
    <div style={{display:"flex",gap:14,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
      <div>
        <div style={{letterSpacing:2,color:"#54ccff",fontSize:12}}>MANY FREIGHT</div>
        <h1 style={{margin:"6px 0"}}>Interactive freight software demo</h1>
      </div>
      <a className="btn" href="/register">Carrier or broker registration</a>
    </div>
    <section role="note" style={{...panel,background:"#15233a",borderColor:"#44769b"}}>
      <strong>SIMULATION — NOT LIVE FREIGHT</strong>
      <p style={{marginBottom:0}}>These are fictitious example loads, companies, routes and rates.
        Changes stay in your browser session only. The demo cannot book, dispatch, pay,
        contact customers, or connect to real freight boards.</p>
    </section>
    <section style={panel}>
      <h2>Explore both company plans</h2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button className={plan==="CARRIER"?"btn primary":"btn"} onClick={()=>setPlan("CARRIER")}>Carrier / Owner-Operator</button>
        <button className={plan==="BROKER"?"btn primary":"btn"} onClick={()=>setPlan("BROKER")}>Freight Broker</button>
      </div>
      <p>{plan==="CARRIER"
        ? "Carrier company preview — loads, dispatch milestones and driver assignments."
        : "Broker company preview — customer loads, dispatch coordination and shipment status."}</p>
      <p style={{opacity:.75}}>{plan==="CARRIER"
        ? "$49.95/month with 1 included seat; additional seats $24.95/month."
        : "$139.95/month with 2 included seats; additional seats $75.95/month."}
        {" "}Prices exclude applicable taxes; billing remains in test mode.</p>
    </section>
    <section style={panel}>
      <h2>Sample load board</h2>
      <label style={{display:"block",marginBottom:12}}>Search simulated loads
        <input className="search" style={{display:"block",width:"100%",marginTop:6}}
          value={search} onChange={event=>setSearch(event.target.value)}
          placeholder="Search route, status or customer" />
      </label>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:650}}>
          <thead><tr><th>Load</th><th>Customer</th><th>Route</th><th>Rate (example)</th><th>Simulated status</th></tr></thead>
          <tbody>{filtered.map(load=><tr key={load.id}>
            <td>#{load.reference}</td>
            <td>{load.customerName}</td>
            <td>{load.pickupAddress} → {load.dropoffAddress}</td>
            <td>{load.rateCents?money(load.rateCents):"Not quoted"}</td>
            <td>
              <select aria-label={"Simulated status for load " + load.reference}
                value={load.status} onChange={e=>updateStatus(load.id,e.target.value)}>
                {["BOOKED","PICKED_UP","IN_TRANSIT","DELIVERED","CANCELLED"].map(status=>
                  <option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}
              </select>
            </td>
          </tr>)}</tbody>
        </table>
      </div>
      {filtered.length===0&&<p>No simulated loads match the search.</p>}
    </section>
    <section style={panel}>
      <h2>Create a sample load</h2>
      <p style={{opacity:.8}}>Try the form. It adds a fake load only to this demo screen.</p>
      <form onSubmit={addSampleLoad} style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <input className="search" aria-label="Sample pickup city" placeholder="Pickup city"
          required maxLength={120} value={origin} onChange={e=>setOrigin(e.target.value)}/>
        <input className="search" aria-label="Sample delivery city" placeholder="Delivery city"
          required maxLength={120} value={destination} onChange={e=>setDestination(e.target.value)}/>
        <button className="btn primary" type="submit">Add simulated load</button>
      </form>
    </section>
    <p style={{marginTop:24,opacity:.8}}>This preview shows sample interactions, not a completed
      broker integration, real-time load board, or verified production payment flow.</p>
  </main>;
}
