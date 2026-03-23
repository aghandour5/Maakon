import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const supabaseUrl = process.env["VITE_SUPABASE_URL"] || "";
const supabaseAnonKey = process.env["VITE_SUPABASE_ANON_KEY"] || "";
const supabaseServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
const isDevSupabaseBypassEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env["DEV_FIREBASE_BYPASS"] === "true";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey) 
  : null;

if (
  process.env.NODE_ENV === "production" &&
  process.env["DEV_FIREBASE_BYPASS"] === "true"
) {
  logger.warn("Ignoring DEV_FIREBASE_BYPASS because NODE_ENV=production");
}

export interface SupabaseTokenPayload {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

/**
 * Verifies a Supabase access token.
 * In dev mode with DEV_FIREBASE_BYPASS=true, returns a mock payload.
 */
export async function verifySupabaseToken(accessToken: string): Promise<SupabaseTokenPayload> {
  if (isDevSupabaseBypassEnabled) {
    logger.info("DEV_FIREBASE_BYPASS is enabled: skipping real token verification");
    try {
      const mock = JSON.parse(accessToken);
      return {
        uid: mock.uid || "dev-uid-123",
        email: mock.email || "dev@example.com",
        email_verified: true,
      };
    } catch {
      const safeToken = accessToken.replace(/[^a-zA-Z0-9]/g, "");
      const uidSuffix = safeToken.slice(-20) || safeToken;
      return {
        uid: `dev-uid-${uidSuffix}`,
        email: accessToken.includes("@") ? accessToken : `${accessToken}@example.com`,
        email_verified: true,
      };
    }
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    throw new Error(error?.message || "Invalid Supabase token");
  }

  return {
    uid: user.id,
    email: user.email,
    email_verified: !!user.email_confirmed_at,
  };
}
