import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/api/casing";
import type { ISupplier } from "@/models/supplier.model";

export async function getSuppliers(): Promise<ISupplier[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, email, secondary_email, active")
    .order("name");

  if (!data || error) {
    throw new Error(error?.message || "Failed to fetch suppliers");
  }

  const suppliers: ISupplier[] = toCamelCase(data);
  return suppliers;
}

export async function createSupplier(supplierData: {
  name: string;
  email: string;
  secondaryEmail?: string;
}): Promise<ISupplier> {
  const supabase = createClient();

  const { name, email, secondaryEmail } = supplierData;
  const formattedData = toSnakeCase({
    name: name.trim(),
    email: email.trim(),
    secondaryEmail: secondaryEmail?.trim() || null,
    active: true,
  });

  const { data, error } = await supabase
    .from("suppliers")
    .insert([formattedData])
    .select("id, name, email, secondary_email, active")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create supplier");
  }

  const supplier: ISupplier = toCamelCase(data);
  return supplier;
}

export async function updateSupplier(data: {
  supplierId: number;
  name: string;
  email: string;
  secondaryEmail?: string;
  active: boolean;
}): Promise<ISupplier> {
  const supabase = createClient();
  const { supplierId, name, email, secondaryEmail, active } = data;

  const supplierData = toSnakeCase({
    name: name.trim(),
    email: email.trim(),
    secondaryEmail: secondaryEmail?.trim() || null,
    active: active,
  });

  const { data: updatedData, error } = await supabase
    .from("suppliers")
    .update(supplierData)
    .eq("id", supplierId)
    .select("id, name, email, secondary_email, active")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update supplier");
  }

  const supplier: ISupplier = toCamelCase(updatedData);
  return supplier;
}
