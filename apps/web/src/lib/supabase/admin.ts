import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. ALL writes on money/certification paths go through
 * module services using this client, AFTER the application-layer permission
 * checks in src/lib/auth.ts — clients never write these tables directly
 * (docs/10 §3). Requires SUPABASE_SECRET_KEY (server-only env).
 */
let cached: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set — write operations are unavailable. " +
        "Add it to the server environment (never to the client bundle).",
    );
  }
  if (!cached) {
    cached = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
