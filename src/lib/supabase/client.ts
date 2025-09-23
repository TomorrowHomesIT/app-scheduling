import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
}

/**
 * Check if the user is currently authenticated
 * This function can be called from outside React components
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getClaims();
    return !error && !!data?.claims;
  } catch (error) {
    console.warn("Failed to check authentication status:", error);
    return false;
  }
};