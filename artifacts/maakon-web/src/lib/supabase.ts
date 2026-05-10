import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createDisabledSupabaseClient(): ReturnType<typeof createClient> {
  const error = new Error(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.",
  );

  return ({
    auth: {
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => undefined,
          },
        },
      }),
      getSession: async () => ({
        data: { session: null },
        error: null,
      }),
      signInWithOtp: async () => ({
        data: { user: null, session: null },
        error,
      }),
      signOut: async () => ({
        error: null,
      }),
    },
  } as unknown) as ReturnType<typeof createClient>;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDisabledSupabaseClient();
