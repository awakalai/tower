import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type PortalDestination = "admin" | "seller";

export async function getPortalDestination(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<PortalDestination> {
  const { data } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return data ? "admin" : "seller";
}
