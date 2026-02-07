
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely access process.env in browser environments
const getEnv = (key: string): string | undefined => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Get credentials from env only (no localStorage - security fix)
const getSupabaseUrl = (): string | undefined => {
  return getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL');
};

const getSupabaseKey = (): string | undefined => {
  return getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');
};

// Lazy initialization to allow credentials to be set at runtime
let supabaseInstance: SupabaseClient | null = null;
let initialized = false;

const initSupabase = (): SupabaseClient | null => {
  if (initialized) return supabaseInstance;

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === 'development') {
      console.info('Supabase credentials not configured. Database features will be disabled. Running in local-only mode.');
    }
    initialized = true;
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  initialized = true;
  return supabaseInstance;
};

// Export a getter function that lazily initializes the client
export const getSupabase = (): SupabaseClient | null => {
  return initSupabase();
};

// Reset the initialization state to allow re-initialization with new credentials
export const resetSupabase = (): void => {
  initialized = false;
  supabaseInstance = null;
};

// For backward compatibility, also export a direct reference
// This will be null initially but can be used after initialization
export const supabase = initSupabase();
