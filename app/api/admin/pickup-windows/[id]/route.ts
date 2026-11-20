import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
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
    updates.capacity = Number(body.capacity);
  const { data, error } = await supabase
    .from("pickup_windows")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ window: data });
}
