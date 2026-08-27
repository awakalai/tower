import { Building2, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { JoinOrganizationForm } from "@/components/auth/join-organization-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function JoinPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "Enterprise" });
  const token = query.token;
  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) notFound();
  return <main className="relative grid min-h-[calc(100svh-4rem)] place-items-center overflow-hidden p-4 sm:p-6"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(204,2,2,.12),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(204,2,2,.08),transparent_35%)]" /><Card className="relative w-full max-w-md overflow-hidden shadow-premium"><div className="h-1.5 bg-primary" /><CardHeader><span className="mb-3 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><Building2 className="size-6" /></span><CardTitle className="text-2xl">{t("joinTitle")}</CardTitle><CardDescription>{t("joinDescription")}</CardDescription></CardHeader><CardContent><JoinOrganizationForm token={token} locale={locale} /><p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-success" />{t("emailBoundInvite")}</p></CardContent></Card></main>;
}
