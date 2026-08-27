"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPortalDestination } from "@/lib/auth/portal";
import { createClient } from "@/lib/supabase/server";
import { passwordUpdateSchema } from "@/lib/validation";

export type UpdatePasswordState = {
  status: "idle" | "error";
  message?: "invalid" | "mismatch" | "expired";
};

export async function updatePasswordAction(
  _previousState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((issue) => issue.message === "passwords_mismatch");
    return { status: "error", message: mismatch ? "mismatch" : "invalid" };
  }

  const supabase = await createClient();
  if (!supabase) return { status: "error", message: "expired" };
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { status: "error", message: "expired" };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: "expired" };

  const destination = await getPortalDestination(supabase, claims.claims.sub);
  revalidatePath(`/${parsed.data.locale}`, "layout");
  redirect(`/${parsed.data.locale}/${destination}`);
}
