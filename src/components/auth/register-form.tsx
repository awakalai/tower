"use client";

import { CheckCircle2, LoaderCircle, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { registerAction, type RegisterState } from "@/app/[locale]/register/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

const initialState: RegisterState = { status: "idle" };

export function RegisterForm() {
  const locale = useLocale();
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(registerAction, initialState);

  if (state.status === "check-email") {
    return (
      <div className="rounded-xl border border-success/20 bg-success/10 p-6 text-center">
        <CheckCircle2 className="mx-auto size-9 text-success" aria-hidden="true" />
        <h2 className="mt-3 font-semibold">{t("checkEmail")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("checkEmailHint")}</p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/login">{t("returnToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-2">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="fullName" name="fullName" autoComplete="name" minLength={2} maxLength={160} required className="ps-10" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="phone" name="phone" type="tel" autoComplete="tel" minLength={6} maxLength={40} required className="ps-10" dir="ltr" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-email">{t("email")}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="register-email" name="email" type="email" autoComplete="email" required className="ps-10" dir="ltr" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-password">{t("password")}</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="register-password" name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required className="ps-10" />
        </div>
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
          {t(state.message)}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {pending ? t("creatingAccount") : t("createAccount")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("alreadyRegistered")} {" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">{t("submit")}</Link>
      </p>
    </form>
  );
}
