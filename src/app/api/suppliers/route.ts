import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import { withAuth } from "@/lib/api/auth";
import type { ISupplier } from "@/models/supplier.model";

export const GET = withAuth(async () => {
  const supabase = await createClient();

  const query = supabase.from("suppliers").select("id, name, email, secondary_email, active");

  const { data, error } = await query.order("name");

  if (!data || error) {
    return Response.json({ error }, { status: 500 });
  }

  const suppliers: ISupplier[] = toCamelCase(data);
  return Response.json(suppliers, { status: 200 });
});
