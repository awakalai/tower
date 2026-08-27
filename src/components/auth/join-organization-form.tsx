"use client";

import { CheckCircle2, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function JoinOrganizationForm({ token, locale }: { token: string; locale: string }) {
  const t = useTranslations("Enterprise");
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function acceptInvite() {
    const supabase = createClient();
    if (!supabase) throw new Error(t("joinError"));
    const { error: acceptError } = await supabase.rpc("accept_organization_invite", { invite_token: token });
    if (acceptError) throw acceptError;
    router.push(`/${locale}/admin`);
    router.refresh();
  }

  async function acceptCurrentAccount() {
    setBusy(true); setError(null);
    try { await acceptInvite(); } catch (cause) { setError(cause instanceof Error ? cause.message : t("joinError")); setBusy(false); }
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const supabase = createClient();
    if (!supabase) return setError(t("joinError"));
    setBusy(true); setError(null);
    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setBusy(false); return; }
      try { await acceptInvite(); } catch (cause) { setError(cause instanceof Error ? cause.message : t("joinError")); setBusy(false); }
      return;
    }
    const redirectTo = `${window.location.origin}/${locale}/join?token=${token}`;
    const { data: signup, error: signupError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    if (signupError) { setError(signupError.message); setBusy(false); return; }
    if (signup.session) {
      try { await acceptInvite(); } catch (cause) { setError(cause instanceof Error ? cause.message : t("joinError")); setBusy(false); }
      return;
    }
    setCheckEmail(true); setBusy(false);
  }

  if (checkEmail) return <div className="rounded-xl border border-success/20 bg-success/10 p-5 text-center"><CheckCircle2 className="mx-auto size-8 text-success" /><p className="mt-3 font-semibold">{t("checkInviteEmail")}</p><p className="mt-1 text-sm text-muted-foreground">{t("checkInviteEmailHint")}</p></div>;

  return (
    <div className="grid gap-5">
      <Button type="button" variant="outline" size="lg" onClick={acceptCurrentAccount} disabled={busy}><ShieldCheck />{t("acceptCurrentAccount")}</Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>{t("orAuthenticate")}</span><span className="h-px flex-1 bg-border" /></div>
      <div className="grid grid-cols-2 rounded-lg bg-muted p-1"><button type="button" onClick={() => setMode("signin")} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "signin" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{t("signIn")}</button><button type="button" onClick={() => setMode("signup")} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{t("createAccount")}</button></div>
      <form onSubmit={authenticate} className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="join-email">{t("email")}</Label><div className="relative"><Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="join-email" name="email" type="email" autoComplete="email" className="ps-10" required /></div></div>
        <div className="grid gap-2"><Label htmlFor="join-password">{t("password")}</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="join-password" name="password" type="password" minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} className="ps-10" required /></div></div>
        {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <Button size="lg" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <UserPlus />}{busy ? t("joining") : mode === "signin" ? t("signInAndJoin") : t("createAndJoin")}</Button>
      </form>
    </div>
  );
}
