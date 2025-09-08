import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import type { ISupplier } from "@/models/supplier.model";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const activeParam = searchParams.get("active");

  let query = supabase.from("suppliers").select("id, name, email, secondary_email, active");

  // Add active filter if provided
  if (activeParam !== null) {
    const isActive = activeParam === "true";
    query = query.eq("active", isActive);
  }

  const { data, error } = await query.order("name");

  if (!data || error) {
    return Response.json({ error }, { status: 500 });
  }

  const suppliers: ISupplier[] = toCamelCase(data);
  return Response.json(suppliers, { status: 200 });
}
