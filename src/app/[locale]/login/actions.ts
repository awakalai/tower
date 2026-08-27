"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";

export type LoginState = {
  status: "idle" | "error";
  message?: "invalid" | "unavailable";
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) return { status: "error", message: "invalid" };

  const supabase = await createClient();
  if (!supabase) return { status: "error", message: "unavailable" };

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { status: "error", message: "invalid" };

  revalidatePath(`/${parsed.data.locale}`, "layout");
  redirect(`/${parsed.data.locale}/admin`);
}

export async function signOutAction(formData: FormData) {
  const localeValue = formData.get("locale");
  const locale = localeValue === "ku" || localeValue === "ar" ? localeValue : "en";
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/login`);
}
