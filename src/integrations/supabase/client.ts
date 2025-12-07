import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("Initializing Supabase client...");
console.log("SUPABASE_URL:", SUPABASE_URL ? "Loaded" : "NOT LOADED");
console.log("SUPABASE_PUBLISHABLE_KEY:", SUPABASE_PUBLISHABLE_KEY ? "Loaded" : "NOT LOADED");

export const supabase: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});