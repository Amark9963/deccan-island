import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("service_dates")
    .select("id,service_date,daily_capacity,booking_deadline,enabled")
    .eq("id", id)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ date: data });
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") updates.enabled = body.enabled;
  if (
    body.capacity !== undefined &&
    Number.isInteger(Number(body.capacity)) &&
    Number(body.capacity) > 0
  )
    updates.daily_capacity = Number(body.capacity);
  if (body.bookingDeadline !== undefined)
    updates.booking_deadline = body.bookingDeadline || null;
  if (body.serviceDate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.serviceDate))
      return NextResponse.json(
        { error: "Invalid service date" },
        { status: 400 },
      );
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("service_date_id", id);
    if ((count ?? 0) > 0)
      return NextResponse.json(
        { error: "This date cannot be edited after orders exist." },
        { status: 409 },
      );
    updates.service_date = body.serviceDate;
  }
  const { data, error } = await supabase
    .from("service_dates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ date: data });
}
