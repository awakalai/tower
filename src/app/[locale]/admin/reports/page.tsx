import { BanknoteArrowDown, BanknoteArrowUp, Landmark, Scale, Target } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EnterprisePageHeader } from "@/components/admin/enterprise-page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCrmData, getDealsData, getProjectsData } from "@/lib/data/enterprise";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [projects, crm, finance, t] = await Promise.all([
    getProjectsData(), getCrmData(), getDealsData(), getTranslations({ locale, namespace: "Enterprise" }),
  ]);
  const sales = finance.deals.filter((deal) => deal.status === "completed").reduce((sum, deal) => sum + Number(deal.total_value), 0);
  const contracted = finance.deals.filter((deal) => ["reserved", "contracted", "completed"].includes(deal.status)).reduce((sum, deal) => sum + Number(deal.total_value), 0);
  const collected = finance.summaries.reduce((sum, row) => sum + Number(row.collected_amount ?? 0), 0);
  const expenses = projects.expenses.reduce((sum, row) => sum + Number(row.amount), 0);
  const profit = collected - expenses;
  const won = crm.leads.filter((lead) => lead.status === "won").length;
  const closed = crm.leads.filter((lead) => ["won", "lost"].includes(lead.status)).length;
  const conversion = closed ? Math.round(won / closed * 100) : 0;

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow={t("intelligence")} title={t("reportsTitle")} description={t("reportsDescription")} icon={Landmark} />
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={t("contractedSales")} value={formatCurrency(contracted, "USD", locale)} icon={Target} tone="brand" />
        <MetricCard label={t("completedSales")} value={formatCurrency(sales, "USD", locale)} icon={BanknoteArrowUp} tone="success" />
        <MetricCard label={t("cashCollected")} value={formatCurrency(collected, "USD", locale)} icon={BanknoteArrowUp} tone="success" />
        <MetricCard label={t("operatingCost")} value={formatCurrency(expenses, "USD", locale)} icon={BanknoteArrowDown} tone="warning" />
        <MetricCard label={t("netCashPosition")} value={formatCurrency(profit, "USD", locale)} icon={Scale} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_.75fr]">
        <Card>
          <CardHeader><CardTitle>{t("projectPerformance")}</CardTitle></CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader><TableRow><TableHead>{t("project")}</TableHead><TableHead>{t("completion")}</TableHead><TableHead>{t("budget")}</TableHead><TableHead>{t("spent")}</TableHead><TableHead>{t("variance")}</TableHead></TableRow></TableHeader>
              <TableBody>{projects.projects.map((project) => {
                const spent = projects.expenses.filter((expense) => expense.project_id === project.id).reduce((sum, row) => sum + Number(row.amount), 0);
                const variance = Number(project.budget) - spent;
                return <TableRow key={project.id}>
                  <TableCell><p className="font-semibold">{project.name}</p><p className="font-mono text-[10px] text-primary">{project.code}</p></TableCell>
                  <TableCell className="min-w-44"><div className="mb-1 flex justify-between text-[10px]"><span>{project.completion_percent}%</span><span>{t(project.status)}</span></div><Progress value={project.completion_percent} /></TableCell>
                  <TableCell>{formatCurrency(Number(project.budget), project.currency, locale)}</TableCell>
                  <TableCell>{formatCurrency(spent, project.currency, locale)}</TableCell>
                  <TableCell className={variance < 0 ? "font-semibold text-destructive" : "font-semibold text-success"}>{formatCurrency(variance, project.currency, locale)}</TableCell>
                </TableRow>;
              })}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="grid gap-6">
          <Card>
            <CardHeader><CardTitle>{t("salesConversion")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end justify-between"><p className="text-5xl font-semibold tracking-[-0.06em]">{conversion}%</p><Badge variant="secondary">{won} {t("won")}</Badge></div>
              <Progress value={conversion} className="mt-5" />
              <div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-lg bg-muted/50 p-3"><p className="text-xl font-semibold">{crm.leads.length}</p><p className="text-[10px] text-muted-foreground">{t("allLeads")}</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xl font-semibold">{won}</p><p className="text-[10px] text-muted-foreground">{t("won")}</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xl font-semibold">{crm.inquiries.length}</p><p className="text-[10px] text-muted-foreground">{t("inquiries")}</p></div></div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>{t("portfolioHealth")}</CardTitle></CardHeader><CardContent className="space-y-4">{["available", "reserved", "construction", "sold"].map((status) => { const count = projects.properties.filter((property) => property.status === status).length; const percent = projects.properties.length ? Math.round(count / projects.properties.length * 100) : 0; return <div key={status}><div className="mb-1.5 flex justify-between text-xs"><span>{t(status)}</span><span>{count} · {percent}%</span></div><Progress value={percent} /></div>; })}</CardContent></Card>
        </div>
      </section>
    </main>
  );
}
