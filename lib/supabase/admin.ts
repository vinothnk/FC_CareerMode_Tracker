import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getOptionalServerEnv, getPublicEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const serviceRoleKey = getOptionalServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    throw new Error("Missing required server environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(
    getPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
