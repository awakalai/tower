"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSiteUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation";

export type RegisterState = {
  status: "idle" | "error" | "check-email";
  message?: "invalid" | "unavailable" | "exists";
};

export async function registerAction(
  _previousState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) return { status: "error", message: "invalid" };

  const supabase = await createClient();
  if (!supabase) return { status: "error", message: "unavailable" };

  const siteUrl = await getSiteUrl();
  const next = `/${parsed.data.locale}/seller`;
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/${parsed.data.locale}/auth/callback?next=${encodeURIComponent(next)}`,
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        locale: parsed.data.locale,
      },
    },
  });

  if (error) {
    const exists = error.code === "user_already_exists" || /already registered/i.test(error.message);
    return { status: "error", message: exists ? "exists" : "invalid" };
  }

  if (!data.session) return { status: "check-email" };

  revalidatePath(`/${parsed.data.locale}`, "layout");
  redirect(next);
}
