import { createClient } from "@supabase/supabase-js";

// We use the specific Supabase project URL here since you provided it.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://edaqojinzumtekwhzfxp.supabase.co";

// The Anon Key needs to be supplied in your .env file
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "PLACEHOLDER_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
