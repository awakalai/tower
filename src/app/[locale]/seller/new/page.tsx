import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { PropertySubmissionForm } from "@/components/seller/property-submission-form";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewSubmissionPage({ params }: PageProps<"/[locale]/seller/new">) {
  const { locale } = await params;
  const [t, supabase] = await Promise.all([
    getTranslations({ locale, namespace: "Seller" }),
    createClient(),
  ]);
  if (!supabase) redirect(`/${locale}/login`);
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect(`/${locale}/login`);

  const { data: profile } = await supabase.from("profiles").select("full_name,phone").eq("user_id", data.claims.sub).maybeSingle();
  const email = typeof data.claims.email === "string" ? data.claims.email : "";

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 -ms-3"><Link href="/seller"><ArrowLeft className="directional-icon" aria-hidden="true" />{t("backToPortal")}</Link></Button>
      <div className="mb-7 flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck aria-hidden="true" /></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-primary">{t("eyebrow")}</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em]">{t("newTitle")}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("newSubtitle")}</p></div></div>
      <PropertySubmissionForm userId={data.claims.sub} locale={locale as "en" | "ku" | "ar"} initialName={profile?.full_name ?? ""} initialPhone={profile?.phone ?? ""} initialEmail={email} />
    </main>
  );
}
