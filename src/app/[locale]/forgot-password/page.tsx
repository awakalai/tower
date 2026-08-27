import { KeyRound } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routing } from "@/i18n/routing";

export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Auth" });

  return (
    <main className="relative grid min-h-[calc(100svh-4rem)] place-items-center overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(204,2,2,.12),transparent_38%)]" />
      <Card className="relative w-full max-w-md overflow-hidden shadow-premium">
        <div className="h-1.5 bg-primary" />
        <CardHeader>
          <span className="mb-3 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><KeyRound aria-hidden="true" /></span>
          <CardTitle className="text-2xl">{t("forgotTitle")}</CardTitle>
          <CardDescription>{t("forgotSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent><ForgotPasswordForm /></CardContent>
      </Card>
    </main>
  );
}
