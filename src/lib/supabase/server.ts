import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { supabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createClient() {
  if (!supabaseEnv.url || !supabaseEnv.publishableKey) return null;

  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseEnv.url, supabaseEnv.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => {
            // Cookie stores do not expose arbitrary response headers in Server Components.
            void key;
            void value;
          });
        } catch {
          // Proxy refreshes the session when Server Components cannot write cookies.
        }
      },
    },
  });
}

export function createPublicClient() {
  if (!supabaseEnv.url || !supabaseEnv.publishableKey) return null;

  return createSupabaseClient<Database>(supabaseEnv.url, supabaseEnv.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
