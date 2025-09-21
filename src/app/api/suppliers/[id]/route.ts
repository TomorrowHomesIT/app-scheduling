import { createClient } from "@/lib/supabase/server";
import { toCamelCase, toSnakeCase } from "@/lib/api/casing";
import { withAuth } from "@/lib/api/auth";
import type { ISupplier } from "@/models/supplier.model";
import type { NextRequest } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PUT = withAuth(async (request: NextRequest, { params }: RouteParams) => {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const supplierId = parseInt(id, 10);

    if (Number.isNaN(supplierId)) {
      return Response.json({ error: "Invalid supplier ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, secondaryEmail, active } = body;

    if (!name?.trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email?.trim()) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const supplierData = toSnakeCase({
      name: name.trim(),
      email: email.trim(),
      secondaryEmail: secondaryEmail?.trim() || null,
      active: active !== false,
    });

    const { data, error } = await supabase
      .from("suppliers")
      .update(supplierData)
      .eq("id", supplierId)
      .select("id, name, email, secondary_email, active")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      if (error.code === "PGRST116") {
        return Response.json({ error: "Supplier not found" }, { status: 404 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    const supplier: ISupplier = toCamelCase(data);
    return Response.json(supplier, { status: 200 });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return Response.json({ error: "Failed to update supplier" }, { status: 500 });
  }
});
