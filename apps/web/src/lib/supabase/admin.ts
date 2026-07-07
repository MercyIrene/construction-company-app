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
  // trim defends against stray whitespace/newlines from copy-paste into env UIs
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set — write operations are unavailable. " +
        "Add it to the server environment (never to the client bundle).",
    );
  }
  const looksValid = key.split(".").length === 3 || key.startsWith("sb_secret_");
  if (!looksValid) {
    throw new Error(
      "SUPABASE_SECRET_KEY looks malformed (expected a JWT or sb_secret_… key). " +
        "Re-paste the service_role key exactly, without quotes or line breaks, " +
        "then redeploy — env changes only apply to new deployments.",
    );
  }
  if (!cached) {
    cached = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
