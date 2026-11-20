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
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.description !== undefined)
    updates.description = String(body.description).trim();
  if (
    body.priceMyr !== undefined &&
    Number.isFinite(Number(body.priceMyr)) &&
    Number(body.priceMyr) >= 0
  )
    updates.price_myr = Number(body.priceMyr);
  if (typeof body.active === "boolean") updates.active = body.active;
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ product: data });
}
