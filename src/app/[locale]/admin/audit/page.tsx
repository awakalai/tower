import { Database, FileClock, ScrollText, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EnterprisePageHeader } from "@/components/admin/enterprise-page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuditLogs } from "@/lib/data/enterprise";
import { toIntlLocale } from "@/lib/utils";

export default async function AuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [logs, t] = await Promise.all([getAuditLogs(), getTranslations({ locale, namespace: "Enterprise" })]);
  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium", timeStyle: "medium" });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow={t("governance")} title={t("auditTitle")} description={t("auditDescription")} icon={ScrollText} />
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label={t("recordedEvents")} value={String(logs.length)} icon={Database} tone="brand" />
        <MetricCard label={t("todayEvents")} value={String(logs.filter((log) => log.created_at.startsWith(today)).length)} icon={FileClock} />
        <MetricCard label={t("protectedTables")} value={String(new Set(logs.map((log) => log.entity_type)).size || 11)} icon={ShieldCheck} tone="success" />
      </section>
      <Card>
        <CardHeader><CardTitle>{t("changeHistory")}</CardTitle></CardHeader>
        <CardContent>
          {logs.length ? <ol className="relative ms-3 border-s">
            {logs.map((log) => <li key={log.id} className="relative pb-7 ps-7 last:pb-0">
              <span className="absolute -start-[7px] top-1.5 size-3 rounded-full border-2 border-card bg-primary" />
              <div className="flex flex-wrap items-center gap-2"><Badge variant={log.action === "DELETE" ? "destructive" : log.action === "INSERT" ? "secondary" : "outline"}>{log.action}</Badge><p className="font-semibold">{log.entity_type}</p><code className="text-[10px] text-muted-foreground">{log.entity_id?.slice(0, 12)}</code></div>
              <p className="mt-1 text-xs text-muted-foreground">{formatter.format(new Date(log.created_at))} · {log.actor_id ? `${t("user")} ${log.actor_id.slice(0, 8)}` : t("system")}</p>
            </li>)}
          </ol> : <div className="py-16 text-center"><ShieldCheck className="mx-auto size-10 text-success" /><p className="mt-3 text-sm font-semibold">{t("auditReady")}</p><p className="mt-1 text-xs text-muted-foreground">{t("auditReadyHint")}</p></div>}
        </CardContent>
      </Card>
    </main>
  );
}
