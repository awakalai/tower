import { CalendarDays, FolderKanban, Landmark, WalletCards } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createProjectAction } from "@/app/[locale]/admin/actions";
import { EnterprisePageHeader } from "@/components/admin/enterprise-page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { OperationalStatusForm } from "@/components/admin/operational-status-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreatePanel, FormField, FormGrid, NativeSelect } from "@/components/ui/native-form";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { getProjectsData } from "@/lib/data/enterprise";
import { formatCurrency, toIntlLocale } from "@/lib/utils";

const statuses = ["planning", "active", "on_hold", "completed", "cancelled"] as const;

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [data, t] = await Promise.all([
    getProjectsData(),
    getTranslations({ locale, namespace: "Enterprise" }),
  ]);
  const labels = Object.fromEntries(statuses.map((status) => [status, t(status)]));
  const spent = data.expenses.reduce((sum, row) => sum + Number(row.amount), 0);
  const budget = data.projects.reduce((sum, row) => sum + Number(row.budget), 0);
  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium" });

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow={t("operations")} title={t("projectsTitle")} description={t("projectsDescription")} icon={FolderKanban} />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("allProjects")} value={String(data.projects.length)} icon={FolderKanban} tone="brand" />
        <MetricCard label={t("activeProjects")} value={String(data.projects.filter((row) => row.status === "active").length)} icon={Landmark} tone="success" />
        <MetricCard label={t("totalBudget")} value={formatCurrency(budget, "USD", locale)} icon={WalletCards} />
        <MetricCard label={t("spent")} value={formatCurrency(spent, "USD", locale)} icon={CalendarDays} tone="warning" />
      </section>

      <CreatePanel title={t("newProject")} description={t("newProjectHint")}>
        <form action={createProjectAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <FormGrid>
            <FormField>{t("name")}<Input name="name" required minLength={2} /></FormField>
            <FormField>{t("code")}<Input name="code" required minLength={2} /></FormField>
            <FormField>{t("status")}<NativeSelect name="status" defaultValue="planning">{statuses.map((status) => <option value={status} key={status}>{t(status)}</option>)}</NativeSelect></FormField>
            <FormField>{t("budget")}<Input name="budget" type="number" min="0" step="0.01" defaultValue="0" required /></FormField>
            <FormField>{t("startDate")}<Input name="start_date" type="date" /></FormField>
            <FormField>{t("endDate")}<Input name="target_completion" type="date" /></FormField>
            <FormField className="sm:col-span-2">{t("address")}<Input name="address" /></FormField>
            <FormField>{t("latitude")}<Input name="latitude" type="number" step="any" /></FormField>
            <FormField>{t("longitude")}<Input name="longitude" type="number" step="any" /></FormField>
            <FormField className="sm:col-span-2">{t("description")}<Textarea name="description" /></FormField>
          </FormGrid>
          <input type="hidden" name="currency" value="USD" />
          <Button type="submit" className="w-fit">{t("createProject")}</Button>
        </form>
      </CreatePanel>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        {data.projects.map((project) => {
          const units = data.properties.filter((row) => row.project_id === project.id);
          const projectExpenses = data.expenses.filter((row) => row.project_id === project.id).reduce((sum, row) => sum + Number(row.amount), 0);
          const tasks = data.tasks.filter((row) => row.project_id === project.id && !["completed", "cancelled"].includes(row.status));
          const utilization = Number(project.budget) ? Math.min(100, Math.round(projectExpenses / Number(project.budget) * 100)) : 0;
          return (
            <Card key={project.id} className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-primary/55 to-transparent" />
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">{project.code}</p>
                  <CardTitle className="mt-1 text-xl">{project.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">{project.description || project.address}</CardDescription>
                </div>
                <OperationalStatusForm locale={locale} table="projects" id={project.id} value={project.status} options={statuses} labels={labels} saveLabel={t("save")} />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/45 p-4 text-center">
                  <div><p className="text-xl font-semibold">{project.completion_percent}%</p><p className="text-[10px] text-muted-foreground">{t("completion")}</p></div>
                  <div><p className="text-xl font-semibold">{units.length}</p><p className="text-[10px] text-muted-foreground">{t("units")}</p></div>
                  <div><p className="text-xl font-semibold">{tasks.length}</p><p className="text-[10px] text-muted-foreground">{t("openTasks")}</p></div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs"><span>{t("budgetUse")}</span><span className="font-semibold">{utilization}%</span></div>
                  <Progress value={utilization} />
                  <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                    <span>{formatCurrency(projectExpenses, project.currency, locale)}</span>
                    <span>{formatCurrency(Number(project.budget), project.currency, locale)}</span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span>{t("startDate")}: {project.start_date ? formatter.format(new Date(project.start_date)) : "—"}</span>
                  <span>{t("endDate")}: {project.target_completion ? formatter.format(new Date(project.target_completion)) : "—"}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
