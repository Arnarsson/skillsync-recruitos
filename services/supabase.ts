
import { createClient } from '@supabase/supabase-js';

// Helper to safely access process.env in browser environments
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Use provided keys as fallback if process.env is empty or undefined
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://ghkcooixmhxvqoaqirbi.supabase.co';
const supabaseKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoa2Nvb2l4bWh4dnFvYXFpcmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODM4ODgsImV4cCI6MjA4MzI1OTg4OH0.dh_zhuFyLpN8L7v84WNjsythJJDmDToxLQ08_dX6rw0';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key missing. Database features will be disabled.');
}

// Create client with explicit values
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
