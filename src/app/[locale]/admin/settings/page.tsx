import { Building2, MapPinned, Settings2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { createBranchAction, updateOrganizationAction } from "@/app/[locale]/admin/actions";
import { EnterprisePageHeader } from "@/components/admin/enterprise-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreatePanel, FormField, FormGrid, NativeSelect } from "@/components/ui/native-form";
import { getEnterpriseContext, getTeamData } from "@/lib/data/enterprise";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [context, team, t] = await Promise.all([getEnterpriseContext(), getTeamData(), getTranslations({ locale, namespace: "Enterprise" })]);
  if (!context) notFound();
  const organization = context.organization;

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow={t("governance")} title={t("settingsTitle")} description={t("settingsDescription")} icon={Settings2} />
      <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5 text-primary" />{t("organizationProfile")}</CardTitle></CardHeader>
          <CardContent>
            <form action={updateOrganizationAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} /><input type="hidden" name="organization_id" value={organization.id} />
              <FormGrid>
                <FormField>{t("businessName")}<Input name="name" defaultValue={organization.name} required /></FormField>
                <FormField>{t("legalName")}<Input name="legal_name" defaultValue={organization.legal_name} /></FormField>
                <FormField>{t("phone")}<Input name="phone" defaultValue={organization.phone} /></FormField>
                <FormField>{t("email")}<Input name="email" type="email" defaultValue={organization.email} /></FormField>
                <FormField className="sm:col-span-2">{t("address")}<Input name="address" defaultValue={organization.address} /></FormField>
                <FormField>{t("taxNumber")}<Input name="tax_number" defaultValue={organization.tax_number} /></FormField>
                <FormField>{t("registrationNumber")}<Input name="registration_number" defaultValue={organization.registration_number} /></FormField>
                <FormField>{t("currency")}<NativeSelect name="default_currency" defaultValue={organization.default_currency}><option value="USD">USD</option><option value="IQD">IQD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></NativeSelect></FormField>
                <FormField>{t("timezone")}<NativeSelect name="timezone" defaultValue={organization.timezone}><option value="Asia/Baghdad">Asia/Baghdad</option><option value="Asia/Dubai">Asia/Dubai</option><option value="Europe/London">Europe/London</option><option value="UTC">UTC</option></NativeSelect></FormField>
              </FormGrid>
              <Button className="w-fit">{t("saveOrganization")}</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid content-start gap-5">
          <CreatePanel title={t("newBranch")} description={t("newBranchHint")}>
            <form action={createBranchAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} /><input type="hidden" name="organization_id" value={organization.id} />
              <FormGrid>
                <FormField>{t("name")}<Input name="name" required /></FormField><FormField>{t("code")}<Input name="code" required /></FormField>
                <FormField>{t("phone")}<Input name="phone" /></FormField><FormField>{t("email")}<Input name="email" type="email" /></FormField>
                <FormField className="sm:col-span-2">{t("address")}<Input name="address" /></FormField>
                <FormField>{t("latitude")}<Input name="latitude" type="number" step="any" /></FormField><FormField>{t("longitude")}<Input name="longitude" type="number" step="any" /></FormField>
              </FormGrid>
              <Button className="w-fit">{t("createBranch")}</Button>
            </form>
          </CreatePanel>
          <Card><CardHeader><CardTitle>{t("branchDirectory")}</CardTitle></CardHeader><CardContent className="grid gap-3">{team.branches.map((branch) => <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4" key={branch.id}><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><MapPinned className="size-4" /></span><div><p className="font-semibold">{branch.name}</p><p className="text-xs text-muted-foreground">{branch.address}</p></div></div><Badge variant={branch.is_active ? "secondary" : "outline"}>{branch.code}</Badge></div>)}</CardContent></Card>
        </div>
      </section>
    </main>
  );
}
