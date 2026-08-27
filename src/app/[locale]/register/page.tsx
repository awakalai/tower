import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getPortalDestination } from "@/lib/auth/portal";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, brand, supabase] = await Promise.all([
    getTranslations({ locale, namespace: "Auth" }),
    getTranslations({ locale, namespace: "Brand" }),
    createClient(),
  ]);

  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) {
      const destination = await getPortalDestination(supabase, data.claims.sub);
      redirect(`/${locale}/${destination}`);
    }
  }

  return (
    <main className="relative grid min-h-[calc(100svh-4rem)] place-items-center overflow-hidden p-4 py-8 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(204,2,2,.12),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(204,2,2,.08),transparent_35%)]" />
      <div className="relative w-full max-w-lg">
        <Button asChild variant="ghost" className="mb-4 -ms-3">
          <Link href="/"><ArrowLeft className="directional-icon" aria-hidden="true" />{t("back")}</Link>
        </Button>
        <Card className="overflow-hidden shadow-premium">
          <div className="h-1.5 bg-primary" />
          <CardHeader>
            <span className="mb-3 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 className="size-6" aria-hidden="true" />
            </span>
            <p className="text-xs font-black tracking-[.18em] text-primary">{brand("name")}</p>
            <CardTitle className="text-2xl tracking-[-0.035em]">{t("sellerRegisterTitle")}</CardTitle>
            <CardDescription>{t("sellerRegisterSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />{t("sellerSafety")}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
