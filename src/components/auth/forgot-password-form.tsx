"use client";

import { CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { forgotPasswordAction, type ForgotPasswordState } from "@/app/[locale]/forgot-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

const initialState: ForgotPasswordState = { status: "idle" };

export function ForgotPasswordForm() {
  const locale = useLocale();
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.status === "sent") {
    return (
      <div className="rounded-xl border border-success/20 bg-success/10 p-6 text-center">
        <CheckCircle2 className="mx-auto size-9 text-success" aria-hidden="true" />
        <h2 className="mt-3 font-semibold">{t("resetEmailSent")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("resetEmailHint")}</p>
        <Button asChild variant="outline" className="mt-5"><Link href="/login">{t("returnToLogin")}</Link></Button>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-2">
        <Label htmlFor="reset-email">{t("email")}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="reset-email" name="email" type="email" autoComplete="email" required className="ps-10" dir="ltr" />
        </div>
      </div>
      {state.status === "error" && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive">{t("resetError")}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {pending ? t("sendingReset") : t("sendReset")}
      </Button>
      <Button asChild variant="ghost"><Link href="/login">{t("returnToLogin")}</Link></Button>
    </form>
  );
}
