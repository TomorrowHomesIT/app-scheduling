import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function createClient() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  // Return existing client if already created
  if (client) {
    return client;
  }

  // Create and store new client
  client = createBrowserClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  return client;
}

/**
 * Check if the user is currently authenticated
 * This function can be called from outside React components
 *
 * Ideally we shouldn't use session as it just checks LS but we want to avoid just making a request to the API to check if the user is authenticated
 * When outside of the react scope
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    return !error && !!data?.session;
  } catch (error) {
    console.warn("Failed to check authentication status:", error);
    return false;
  }
};
