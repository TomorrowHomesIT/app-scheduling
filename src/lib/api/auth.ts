import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

type Handler = (req: NextRequest, context?: unknown) => Promise<Response>;

/** Ensure pretty much all API requests are from authenticated users via Supabase */
export function withAuth(handler: Handler): Handler {
  return async (req, context) => {
    const supabase = await createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, context);
  };
}
