"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { updatePasswordAction, type UpdatePasswordState } from "@/app/[locale]/update-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: UpdatePasswordState = { status: "idle" };

export function UpdatePasswordForm() {
  const locale = useLocale();
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      {(["password", "confirmation"] as const).map((field) => (
        <div className="grid gap-2" key={field}>
          <Label htmlFor={field}>{t(field === "password" ? "newPassword" : "confirmPassword")}</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id={field} name={field} type="password" minLength={8} maxLength={128} autoComplete="new-password" required className="ps-10" />
          </div>
        </div>
      ))}
      {state.status === "error" && state.message && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive">{t(state.message)}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {pending ? t("updatingPassword") : t("updatePassword")}
      </Button>
    </form>
  );
}
