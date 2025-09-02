import { redirect } from "next/navigation";

export default function Home() {
  // TODO: Remove this once we have a proper home page
  redirect("/jobs");
}
