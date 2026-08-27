"use client";

import { LockKeyhole, LoaderCircle, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/[locale]/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const locale = useLocale();
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="email" name="email" type="email" autoComplete="email" required className="ps-10" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{t("password")}</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            autoComplete="current-password"
            required
            className="ps-10"
          />
        </div>
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
          {t(state.message)}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
