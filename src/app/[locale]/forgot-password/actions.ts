"use server";

import { getSiteUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validation";

export type ForgotPasswordState = {
  status: "idle" | "error" | "sent";
};

export async function forgotPasswordAction(
  _previousState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { status: "error" };

  const supabase = await createClient();
  if (!supabase) return { status: "error" };

  const siteUrl = await getSiteUrl();
  const next = `/${parsed.data.locale}/update-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/${parsed.data.locale}/auth/callback?next=${encodeURIComponent(next)}`,
  });

  if (error) return { status: "error" };
  return { status: "sent" };
}
