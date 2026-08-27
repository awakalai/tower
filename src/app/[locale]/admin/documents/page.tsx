import { FolderLock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { DocumentVault } from "@/components/admin/document-vault";
import { EnterprisePageHeader } from "@/components/admin/enterprise-page-header";
import { getDocumentVaultData, getEnterpriseContext } from "@/lib/data/enterprise";

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = locale === "ku" || locale === "ar" ? locale : "en";
  const [context, data, t] = await Promise.all([
    getEnterpriseContext(), getDocumentVaultData(safeLocale), getTranslations({ locale, namespace: "Enterprise" }),
  ]);
  if (!context) notFound();
  return <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8"><EnterprisePageHeader eyebrow={t("governance")} title={t("documentsTitle")} description={t("documentsDescription")} icon={FolderLock} /><DocumentVault organizationId={context.organization.id} initialData={data} /></main>;
}
