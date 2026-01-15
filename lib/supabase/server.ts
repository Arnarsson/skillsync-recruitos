import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client
// Uses environment variables (no NEXT_PUBLIC_ prefix needed for server-side)
export function createServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

// Singleton for server-side usage
let serverClient: ReturnType<typeof createServerClient> | null = null;

export function getSupabaseServerClient() {
  if (!serverClient) {
    serverClient = createServerClient();
  }
  return serverClient;
}
