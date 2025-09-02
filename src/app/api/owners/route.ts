import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import type { ISupplier } from "@/models/supplier.model";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("suppliers").select("id, name, email").order("name");

  if (!data || error) {
    return Response.json({ error }, { status: 500 });
  }

  const suppliers: ISupplier[] = toCamelCase(data);
  return Response.json(suppliers, { status: 200 });
}
