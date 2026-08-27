import { AlertCircle, CheckCircle2, ClipboardCheck, ListTodo } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createTaskAction } from "@/app/[locale]/admin/actions";
import { EnterprisePageHeader } from "@/components/admin/enterprise-page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { OperationalStatusForm } from "@/components/admin/operational-status-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreatePanel, FormField, FormGrid, NativeSelect } from "@/components/ui/native-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getTaskWorkspace } from "@/lib/data/enterprise";
import { normalizeLocalizedText } from "@/lib/domain";
import { toIntlLocale } from "@/lib/utils";

const statuses = ["open", "in_progress", "completed", "cancelled"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;

export default async function TasksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [workspace, t] = await Promise.all([
    getTaskWorkspace(),
    getTranslations({ locale, namespace: "Enterprise" }),
  ]);
  const tasks = workspace.tasks;
  const labels = Object.fromEntries(statuses.map((status) => [status, t(status)]));
  const propertyNames = new Map(workspace.properties.map((property) => {
    const title = normalizeLocalizedText(property.title);
    return [property.id, title[locale as keyof typeof title] || title.en];
  }));
  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium", timeStyle: "short" });
  const now = new Date().toISOString();
  const late = tasks.filter((task) => task.due_at && task.due_at < now && !["completed", "cancelled"].includes(task.status));

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow={t("operations")} title={t("tasksTitle")} description={t("tasksDescription")} icon={ClipboardCheck} />
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("allTasks")} value={String(tasks.length)} icon={ListTodo} tone="brand" />
        <MetricCard label={t("inProgress")} value={String(tasks.filter((item) => item.status === "in_progress").length)} icon={ClipboardCheck} />
        <MetricCard label={t("completed")} value={String(tasks.filter((item) => item.status === "completed").length)} icon={CheckCircle2} tone="success" />
        <MetricCard label={t("overdue")} value={String(late.length)} icon={AlertCircle} tone="warning" />
      </section>

      <CreatePanel title={t("newTask")} description={t("newTaskHint")}>
        <form action={createTaskAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <FormGrid>
            <FormField className="sm:col-span-2">{t("taskTitle")}<Input name="title" required minLength={2} /></FormField>
            <FormField>{t("priority")}<NativeSelect name="priority" defaultValue="normal">{priorities.map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
            <FormField>{t("status")}<NativeSelect name="status" defaultValue="open">{statuses.map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
            <FormField>{t("dueDate")}<Input name="due_at" type="datetime-local" /></FormField>
            <FormField>{t("project")}<NativeSelect name="project_id" defaultValue=""><option value="">{t("none")}</option>{workspace.projects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</NativeSelect></FormField>
            <FormField>{t("property")}<NativeSelect name="property_id" defaultValue=""><option value="">{t("none")}</option>{workspace.properties.map((item) => <option value={item.id} key={item.id}>{propertyNames.get(item.id)}</option>)}</NativeSelect></FormField>
            <FormField>{t("lead")}<NativeSelect name="lead_id" defaultValue=""><option value="">{t("none")}</option>{workspace.leads.map((item) => <option value={item.id} key={item.id}>{item.id.slice(0, 8)} · {t(item.status)}</option>)}</NativeSelect></FormField>
            <FormField>{t("contract")}<NativeSelect name="deal_id" defaultValue=""><option value="">{t("none")}</option>{workspace.deals.map((item) => <option value={item.id} key={item.id}>{item.contract_number}</option>)}</NativeSelect></FormField>
            <FormField className="sm:col-span-2">{t("description")}<Textarea name="description" /></FormField>
          </FormGrid>
          <Button className="w-fit">{t("createTask")}</Button>
        </form>
      </CreatePanel>

      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>{t("workQueue")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("taskTitle")}</TableHead><TableHead>{t("relatedTo")}</TableHead><TableHead>{t("priority")}</TableHead><TableHead>{t("dueDate")}</TableHead><TableHead>{t("status")}</TableHead></TableRow></TableHeader>
            <TableBody>{tasks.map((task) => {
              const isLate = task.due_at && task.due_at < now && !["completed", "cancelled"].includes(task.status);
              const relation = workspace.projects.find((item) => item.id === task.project_id)?.name || (task.property_id ? propertyNames.get(task.property_id) : null) || workspace.deals.find((item) => item.id === task.deal_id)?.contract_number || "—";
              return <TableRow key={task.id} className={isLate ? "bg-destructive/[.035]" : undefined}>
                <TableCell><p className="font-semibold">{task.title}</p><p className="mt-1 max-w-80 truncate text-xs text-muted-foreground">{task.description}</p></TableCell>
                <TableCell>{relation}</TableCell>
                <TableCell><Badge variant={task.priority === "urgent" ? "destructive" : "secondary"}>{t(task.priority)}</Badge></TableCell>
                <TableCell>{task.due_at ? formatter.format(new Date(task.due_at)) : "—"}{isLate && <Badge variant="destructive" className="ms-2">{t("late")}</Badge>}</TableCell>
                <TableCell><OperationalStatusForm locale={locale} table="tasks" id={task.id} value={task.status} options={statuses} labels={labels} saveLabel={t("save")} /></TableCell>
              </TableRow>;
            })}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
