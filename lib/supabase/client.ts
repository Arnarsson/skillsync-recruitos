import { createClient } from "@supabase/supabase-js";

// Client-side Supabase client
// Uses environment variables (must be prefixed with NEXT_PUBLIC_ for client-side)
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const missing = [
      !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
      !supabaseKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ].filter(Boolean);
    console.warn(`[Supabase] Client not initialized — missing: ${missing.join(", ")}`);
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Singleton for client-side usage
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}
