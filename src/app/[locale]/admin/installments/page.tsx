import { AlertTriangle, CalendarClock, CircleCheckBig, ReceiptCent } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createInstallmentAction } from "@/app/[locale]/admin/actions";
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
import { getDealsData } from "@/lib/data/enterprise";
import { formatCurrency, toIntlLocale } from "@/lib/utils";

const statuses = ["pending", "partial", "paid", "overdue", "waived"] as const;

export default async function InstallmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [data, t] = await Promise.all([getDealsData(), getTranslations({ locale, namespace: "Enterprise" })]);
  const deals = new Map(data.deals.map((deal) => [deal.id, deal]));
  const contacts = new Map(data.contacts.map((contact) => [contact.id, `${contact.first_name} ${contact.last_name}`.trim()]));
  const labels = Object.fromEntries(statuses.map((status) => [status, t(status)]));
  const today = new Date().toISOString().slice(0, 10);
  const overdue = data.installments.filter((item) => item.status === "overdue" || (["pending", "partial"].includes(item.status) && item.due_date < today));
  const scheduled = data.installments.reduce((sum, item) => sum + Number(item.amount), 0);
  const paid = data.installments.reduce((sum, item) => sum + Number(item.paid_amount), 0);
  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium" });

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow={t("finance")} title={t("installmentsTitle")} description={t("installmentsDescription")} icon={ReceiptCent} />
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("scheduled")} value={formatCurrency(scheduled, "USD", locale)} icon={CalendarClock} tone="brand" />
        <MetricCard label={t("collected")} value={formatCurrency(paid, "USD", locale)} icon={CircleCheckBig} tone="success" />
        <MetricCard label={t("outstanding")} value={formatCurrency(scheduled - paid, "USD", locale)} icon={ReceiptCent} tone="warning" />
        <MetricCard label={t("overdue")} value={String(overdue.length)} icon={AlertTriangle} tone="warning" />
      </section>

      <CreatePanel title={t("newInstallment")} description={t("newInstallmentHint")}>
        <form action={createInstallmentAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <FormGrid>
            <FormField>{t("contract")}<NativeSelect name="deal_id" required defaultValue=""><option value="" disabled>{t("select")}</option>{data.deals.map((deal) => <option value={deal.id} key={deal.id}>{deal.contract_number} · {contacts.get(deal.contact_id)}</option>)}</NativeSelect></FormField>
            <FormField>{t("installmentNumber")}<Input name="sequence_number" type="number" min="1" required /></FormField>
            <FormField>{t("amount")}<Input name="amount" type="number" min="0.01" step="0.01" required /></FormField>
            <FormField>{t("paidAmount")}<Input name="paid_amount" type="number" min="0" step="0.01" defaultValue="0" /></FormField>
            <FormField>{t("dueDate")}<Input name="due_date" type="date" required /></FormField>
            <FormField>{t("status")}<NativeSelect name="status" defaultValue="pending">{statuses.map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
            <FormField className="sm:col-span-2">{t("notes")}<Textarea name="notes" /></FormField>
          </FormGrid>
          <input type="hidden" name="currency" value="USD" />
          <Button className="w-fit">{t("createInstallment")}</Button>
        </form>
      </CreatePanel>

      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>{t("collectionSchedule")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("contract")}</TableHead><TableHead>{t("customer")}</TableHead><TableHead>{t("installmentNumber")}</TableHead><TableHead>{t("dueDate")}</TableHead><TableHead>{t("amount")}</TableHead><TableHead>{t("paidAmount")}</TableHead><TableHead>{t("status")}</TableHead></TableRow></TableHeader>
            <TableBody>{data.installments.map((item) => {
              const deal = deals.get(item.deal_id);
              const isLate = item.status === "overdue" || (["pending", "partial"].includes(item.status) && item.due_date < today);
              return <TableRow key={item.id} className={isLate ? "bg-destructive/[.035]" : undefined}>
                <TableCell className="font-mono text-xs font-bold">{deal?.contract_number ?? "—"}</TableCell>
                <TableCell>{deal ? contacts.get(deal.contact_id) : "—"}</TableCell>
                <TableCell>#{item.sequence_number}</TableCell>
                <TableCell>{formatter.format(new Date(item.due_date))}{isLate && <Badge variant="destructive" className="ms-2">{t("late")}</Badge>}</TableCell>
                <TableCell>{formatCurrency(Number(item.amount), item.currency, locale)}</TableCell>
                <TableCell>{formatCurrency(Number(item.paid_amount), item.currency, locale)}</TableCell>
                <TableCell><OperationalStatusForm locale={locale} table="installments" id={item.id} value={item.status} options={statuses} labels={labels} saveLabel={t("save")} /></TableCell>
              </TableRow>;
            })}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
