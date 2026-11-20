import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import "./admin.css";
import AdminControls from "./AdminControls";
import AdminDateActions from "./AdminDateActions";
import { AdminOrderActions } from "./AdminOrderActions";
import AdminWindowControls from "./AdminWindowControls";
import AdminDateMenuControls from "./AdminDateMenuControls";
import AdminSignOut from "./AdminSignOut";
import AdminWorkspace from "./AdminWorkspace";
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
        <div className="admin-title">
          <div>
            <p className="eyebrow">Operations dashboard</p>
            <h1>Good morning.</h1>
          </div>
          <span className="admin-status">
            Live orders{" "}
            {process.env.ENABLE_LIVE_ORDERS === "true" ? "enabled" : "disabled"}
          </span>
        </div>
        <div className="admin-stats">
          <div>
            <span>Confirmed portions</span>
            <strong>{confirmed.reduce((s, o) => s + o.quantity, 0)}</strong>
          </div>
          <div>
            <span>Confirmed value</span>
            <strong>
              RM
              {confirmed
                .reduce((s, o) => s + Number(o.total_myr), 0)
                .toFixed(2)}
            </strong>
          </div>
          <div>
            <span>Pending orders</span>
            <strong>{pending.length}</strong>
          </div>
          <div>
            <span>Upcoming dates</span>
            <strong>{(dates ?? []).filter((d) => d.enabled).length}</strong>
          </div>
        </div>
        <AdminWorkspace>
        <section className="admin-section admin-panel" data-admin-panel="calendar">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">Service dates</p>
              <h2>Weekend calendar</h2>
            </div>
          </div>
          <div className="admin-table">
            {(dates ?? []).map((date) => (
              <div className="admin-row" key={date.id}>
                <div>
                  <strong>
                    {new Intl.DateTimeFormat("en-MY", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      timeZone: "Asia/Kuala_Lumpur",
                    }).format(new Date(`${date.service_date}T12:00:00+08:00`))}
                  </strong>
                  <span>
                    {date.booking_deadline
                      ? `Cut-off ${new Date(date.booking_deadline).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}`
                      : "No deadline set"}
                  </span>
                </div>
                <span
                  className={date.enabled ? "date-enabled" : "date-disabled"}
                >
                  {date.enabled ? "Bookable" : "Closed"}
                </span>
                <span>{date.daily_capacity} portions</span>
                <AdminDateActions id={date.id} enabled={date.enabled} />
              </div>
            ))}
          </div>
        </section>
        <div className="admin-panel" data-admin-panel="calendar">
          <div className="admin-tools-grid">
            <AdminControls view="dates" />
            <AdminWindowControls dates={dateOptions} />
          </div>
        </div>
        <div className="admin-panel" data-admin-panel="menu">
          <AdminDateMenuControls dates={dateOptions} />
          <AdminControls view="products" />
        </div>
        <section className="admin-section admin-panel" data-admin-panel="orders">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">Recent orders</p>
              <h2>Order queue</h2>
            </div>
            <a className="admin-secondary" href="/api/admin/export">
              Export CSV
            </a>
          </div>
          <div className="admin-table">
            {(orders ?? []).slice(0, 8).map((order) => (
              <div className="admin-row admin-order-row" key={order.id}>
                <div>
                  <strong>{order.order_reference}</strong>
                  <span>
                    {order.customer_name} · {order.quantity} portion
                    {order.quantity === 1 ? "" : "s"}
                  </span>
                  <small className="order-items-note">
                    {(order.order_items ?? [])
                      .map((item) => `${item.quantity}× ${item.product_name}`)
                      .join(" · ")}
                  </small>
                  {order.fulfillment_type === "delivery" && (
                    <small className="delivery-order-note">
                      Delivery · {order.delivery_postcode} ·{" "}
                      {order.delivery_status?.replaceAll("_", " ")}
                    </small>
                  )}
                </div>
                <span className="order-status">
                  {order.status.replaceAll("_", " ")}
                </span>
                <strong>RM{Number(order.total_myr).toFixed(2)}</strong>
                <AdminOrderActions
                  id={order.id}
                  status={order.status}
                  paymentStatus={order.payment_status}
                  fulfillmentType={order.fulfillment_type}
                  deliveryStatus={order.delivery_status}
                />
              </div>
            ))}
            {(!orders || orders.length === 0) && (
              <p className="admin-empty-row">No orders yet.</p>
            )}
          </div>
        </section>
        </AdminWorkspace>
      </div>
    </main>
  );
}
