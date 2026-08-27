"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createClient() {
  if (!supabaseEnv.url || !supabaseEnv.publishableKey) return null;
  return createBrowserClient<Database>(supabaseEnv.url, supabaseEnv.publishableKey);
}
