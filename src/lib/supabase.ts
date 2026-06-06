import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta.env !== "undefined" && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env && (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)) ||
  "https://ofzigbgldbswfhfmipei.supabase.co";

const supabaseAnonKey =
  (typeof import.meta.env !== "undefined" && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process.env && (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)) ||
  "sb_publishable_7af7LtWnpWAcKoBFjgHJ_Q_ZmNh-NAV";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !supabaseUrl.includes("your-") &&
  !!supabaseAnonKey &&
  !supabaseAnonKey.includes("your-");