import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import "./admin.css";
import AdminControls from "./AdminControls";
import AdminDateActions from "./AdminDateActions";
import AdminWindowControls from "./AdminWindowControls";
import AdminDateMenuControls from "./AdminDateMenuControls";
import AdminSignOut from "./AdminSignOut";
import AdminWorkspace from "./AdminWorkspace";
import AdminOrderQueue, { type AdminOrder } from "./AdminOrderQueue";
import "./admin-workspace.css";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin } = await supabase
    .from("admin_users")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin)
    return (
      <main className="admin-shell">
        <header className="admin-header">
          <a href="/">
            <img src="/deccan-island-logo.svg" alt="Deccan Island" />
          </a>
          <span>Signed in as {user.email}</span>
        </header>
        <div className="admin-empty">
          <h1>Admin access pending</h1>
          <p>
            Your account is authenticated, but it has not been added to the
            Deccan Island admin allowlist.
          </p>
        </div>
      </main>
    );
  const [{ data: dates }, { data: orders }] = await Promise.all([
    supabase
      .from("service_dates")
      .select(
        "id,service_date,enabled,daily_capacity,booking_deadline,pickup_windows(id,starts_at,ends_at,capacity,enabled)",
      )
      .order("service_date", { ascending: true })
      .limit(14),
    supabase
      .from("orders")
      .select(
        "id,order_reference,status,payment_status,quantity,total_myr,customer_name,created_at,fulfillment_type,delivery_status,delivery_address,delivery_postcode,delivery_notes,service_dates(service_date),order_items(product_name,quantity,line_total_myr)",
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const confirmed = (orders ?? []).filter((o) =>
    ["confirmed", "collected"].includes(o.status),
  );
  const pending = (orders ?? []).filter((o) =>
    ["awaiting_payment", "payment_under_review"].includes(o.status),
  );
  const dateOptions = (dates ?? []).map((d) => ({
    id: d.id,
    service_date: d.service_date,
  }));
  const normalizedOrders: AdminOrder[] = (orders ?? []).map((order) => ({
    ...order,
    total_myr: Number(order.total_myr),
    service_date: order.service_dates?.[0]?.service_date,
    order_items: order.order_items ?? [],
  }));
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  });
  const upcomingDates = (dates ?? []).filter(
    (date) => date.service_date >= today,
  );
  const nextServiceDate = upcomingDates.find((date) => date.enabled);
  const bookedForDate = (serviceDate: string) =>
    normalizedOrders
      .filter(
        (order) =>
          order.service_date === serviceDate &&
          ["confirmed", "collected"].includes(order.status),
      )
      .reduce((total, order) => total + order.quantity, 0);
  const deliveryRequests = normalizedOrders.filter(
    (order) =>
      order.fulfillment_type === "delivery" &&
      !["delivered", "cancelled"].includes(order.delivery_status ?? ""),
  ).length;
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a href="/">
          <img src="/deccan-island-logo.svg" alt="Deccan Island" />
        </a>
        <div>
          <span>{admin.display_name ?? user.email}</span>
          <a href="/">View site ↗</a>
          <AdminSignOut />
        </div>
      </header>
      <div className="admin-content">
        <AdminWorkspace attentionCount={pending.length}>
        <section className="admin-panel admin-home-panel" data-admin-panel="home">
          <div className="admin-title">
            <div>
              <p className="eyebrow">Operations dashboard</p>
              <h1>Good morning.</h1>
            </div>
            <span className="admin-status">
              Orders {process.env.ENABLE_LIVE_ORDERS === "true" ? "open" : "paused"}
            </span>
          </div>
          <div className="admin-stats">
            <div>
              <span>Confirmed portions</span>
              <strong>{confirmed.reduce((s, o) => s + o.quantity, 0)}</strong>
            </div>
            <div>
              <span>Confirmed value</span>
              <strong>RM{confirmed.reduce((s, o) => s + Number(o.total_myr), 0).toFixed(2)}</strong>
            </div>
            <div className={pending.length ? "needs-attention" : ""}>
              <span>Needs attention</span>
              <strong>{pending.length}</strong>
            </div>
            <div>
              <span>Delivery requests</span>
              <strong>{deliveryRequests}</strong>
            </div>
          </div>
          <section className="admin-home-section">
            <div className="admin-section-heading">
              <div>
                <p className="eyebrow">Next service</p>
                <h2>{nextServiceDate ? new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(`${nextServiceDate.service_date}T12:00:00+08:00`)) : "No open service date"}</h2>
              </div>
            </div>
            {nextServiceDate ? (() => {
              const booked = bookedForDate(nextServiceDate.service_date);
              const percent = Math.min(100, Math.round((booked / nextServiceDate.daily_capacity) * 100));
              return <div className="admin-next-service-card">
                <div className="admin-capacity-head"><span>Confirmed capacity</span><strong>{booked} / {nextServiceDate.daily_capacity} portions</strong></div>
                <div className="admin-capacity-track" aria-label={`${percent}% booked`}><span style={{ width: `${percent}%` }} /></div>
                <div className="admin-next-service-meta">
                  <span>{nextServiceDate.pickup_windows?.filter((window) => window.enabled).length ?? 0} collection slots</span>
                  <span>{pending.length} orders need review</span>
                </div>
              </div>;
            })() : <p className="admin-empty-row">Create or enable a service date from Schedule.</p>}
          </section>
        </section>

        <section className="admin-section admin-panel" data-admin-panel="orders">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">Order management</p>
              <h2>Orders</h2>
            </div>
            <a className="admin-secondary" href="/api/admin/export">Export CSV</a>
          </div>
          <AdminOrderQueue orders={normalizedOrders} />
        </section>

        <section className="admin-section admin-panel" data-admin-panel="schedule">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">Service schedule</p>
              <h2>Upcoming service days</h2>
            </div>
          </div>
          <div className="admin-schedule-list">
            {upcomingDates.map((date) => {
              const booked = bookedForDate(date.service_date);
              const percent = Math.min(100, Math.round((booked / date.daily_capacity) * 100));
              return <article className="admin-service-card" key={date.id}>
                <div className="admin-service-date">
                  <strong>{new Intl.DateTimeFormat("en-MY", { day: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(`${date.service_date}T12:00:00+08:00`))}</strong>
                  <span>{new Intl.DateTimeFormat("en-MY", { weekday: "short", month: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(`${date.service_date}T12:00:00+08:00`))}</span>
                </div>
                <div className="admin-service-main">
                  <div className="admin-service-head">
                    <span className={date.enabled ? "admin-status-pill status-confirmed" : "admin-status-pill status-closed"}>{date.enabled ? "Open" : "Closed"}</span>
                    <strong>{booked} / {date.daily_capacity} portions</strong>
                  </div>
                  <div className="admin-capacity-track"><span style={{ width: `${percent}%` }} /></div>
                  <p>{date.booking_deadline ? `Orders close ${new Date(date.booking_deadline).toLocaleString("en-MY", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" })}` : "No booking deadline"}</p>
                  <div className="admin-slot-list">
                    {(date.pickup_windows ?? []).filter((window) => window.enabled).map((window) => <span key={window.id}>{window.starts_at.slice(0, 5)}–{window.ends_at.slice(0, 5)}</span>)}
                    {!(date.pickup_windows ?? []).some((window) => window.enabled) && <span>No collection slots</span>}
                  </div>
                  <AdminDateActions id={date.id} enabled={date.enabled} />
                </div>
              </article>;
            })}
            {upcomingDates.length === 0 && <div className="admin-empty-state"><strong>No upcoming service days</strong><span>Add the next weekend below.</span></div>}
          </div>
        </section>
        <div className="admin-panel" data-admin-panel="schedule">
          <div className="admin-tools-grid">
            <AdminControls view="dates" />
            <AdminWindowControls dates={dateOptions} />
          </div>
        </div>
        <div className="admin-panel" data-admin-panel="menu">
          <AdminDateMenuControls dates={dateOptions} />
          <AdminControls view="products" />
        </div>
        </AdminWorkspace>
      </div>
    </main>
  );
}
