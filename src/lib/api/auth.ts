import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

type Handler<T = unknown> = (req: NextRequest, context: T) => Promise<Response>;

/** Ensure pretty much all API requests are from authenticated users via Supabase */
export function withAuth<T = unknown>(handler: Handler<T>): Handler<T> {
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
