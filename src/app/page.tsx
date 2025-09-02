import { redirect } from "next/navigation";
import useSupplierStore from "@/store/supplier-store";
import { useEffect } from "react";

export default function Home() {
  // TODO: Remove this once we have a proper home page
  redirect("/jobs");
}
