import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!isAdmin || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (
    [
      "awaiting_payment",
      "payment_under_review",
      "confirmed",
      "collected",
      "cancelled",
    ].includes(body.status)
  )
    updates.status = body.status;
  if (
    ["unpaid", "reported", "verified", "refunded"].includes(body.paymentStatus)
  )
    updates.payment_status = body.paymentStatus;
  if (
    [
      "not_required",
      "pending_review",
      "approved",
      "booked",
      "in_transit",
      "delivered",
      "cancelled",
    ].includes(body.deliveryStatus)
  )
    updates.delivery_status = body.deliveryStatus;
  if (body.deliveryProvider !== undefined)
    updates.delivery_provider = body.deliveryProvider || null;
  if (body.driverName !== undefined)
    updates.driver_name = body.driverName || null;
  if (body.driverContact !== undefined)
    updates.driver_contact = body.driverContact || null;
  if (body.status === "confirmed")
    updates.confirmed_at = new Date().toISOString();
  if (body.status === "collected")
    updates.collected_at = new Date().toISOString();
  if (body.status === "cancelled")
    updates.cancelled_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select("id,order_reference,status,payment_status,delivery_status")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  if (body.status === "confirmed")
    await supabase
      .from("reservations")
      .update({ status: "converted" })
      .eq("order_id", id);
  if (body.status === "cancelled")
    await supabase
      .from("reservations")
      .update({ status: "cancelled", released_at: new Date().toISOString() })
      .eq("order_id", id);
  await supabase
    .from("order_events")
    .insert({
      order_id: id,
      event_type: "admin_update",
      to_status: data.status,
      actor_user_id: user.id,
      note: body.note || body.deliveryStatus || null,
    });
  return NextResponse.json({ order: data });
}
