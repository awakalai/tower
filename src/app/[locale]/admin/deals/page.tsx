import { BadgeDollarSign, BriefcaseBusiness, CircleCheckBig, HandCoins } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createDealAction } from "@/app/[locale]/admin/actions";
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
import { normalizeLocalizedText } from "@/lib/domain";
import { formatCurrency, toIntlLocale } from "@/lib/utils";

const statuses = ["draft", "reserved", "contracted", "completed", "cancelled"] as const;

export default async function DealsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [data, t] = await Promise.all([getDealsData(), getTranslations({ locale, namespace: "Enterprise" })]);
  const contacts = new Map(data.contacts.map((item) => [item.id, `${item.first_name} ${item.last_name}`.trim()]));
  const properties = new Map(data.properties.map((item) => {
    const title = normalizeLocalizedText(item.title);
    return [item.id, title[locale as keyof typeof title] || title.en];
  }));
  const summaries = new Map(data.summaries.map((item) => [item.deal_id, item]));
  const labels = Object.fromEntries(statuses.map((status) => [status, t(status)]));
  const total = data.deals.reduce((sum, row) => sum + Number(row.total_value), 0);
  const collected = data.summaries.reduce((sum, row) => sum + Number(row.collected_amount ?? 0), 0);
  const outstanding = data.summaries.reduce((sum, row) => sum + Number(row.outstanding_amount ?? 0), 0);
  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium" });

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow={t("sales")} title={t("dealsTitle")} description={t("dealsDescription")} icon={BriefcaseBusiness} />
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("contractValue")} value={formatCurrency(total, "USD", locale)} icon={BriefcaseBusiness} tone="brand" />
        <MetricCard label={t("collected")} value={formatCurrency(collected, "USD", locale)} icon={CircleCheckBig} tone="success" />
        <MetricCard label={t("outstanding")} value={formatCurrency(outstanding, "USD", locale)} icon={HandCoins} tone="warning" />
        <MetricCard label={t("activeDeals")} value={String(data.deals.filter((row) => !["completed", "cancelled"].includes(row.status)).length)} icon={BadgeDollarSign} />
      </section>

      <CreatePanel title={t("newDeal")} description={t("newDealHint")}>
        <form action={createDealAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <FormGrid>
            <FormField>{t("customer")}<NativeSelect name="contact_id" required defaultValue=""><option value="" disabled>{t("select")}</option>{data.contacts.map((item) => <option value={item.id} key={item.id}>{contacts.get(item.id)}</option>)}</NativeSelect></FormField>
            <FormField>{t("status")}<NativeSelect name="status" defaultValue="draft">{statuses.map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
            <FormField>{t("property")}<NativeSelect name="property_id" defaultValue=""><option value="">{t("none")}</option>{data.properties.map((item) => <option value={item.id} key={item.id}>{properties.get(item.id)}</option>)}</NativeSelect></FormField>
            <FormField>{t("project")}<NativeSelect name="project_id" defaultValue=""><option value="">{t("none")}</option>{data.projects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</NativeSelect></FormField>
            <FormField>{t("paymentMethod")}<NativeSelect name="payment_method" defaultValue="installment"><option value="cash">{t("cash")}</option><option value="installment">{t("installment")}</option><option value="advance">{t("advance")}</option></NativeSelect></FormField>
            <FormField>{t("contractValue")}<Input name="total_value" type="number" min="0.01" step="0.01" required /></FormField>
            <FormField>{t("downPayment")}<Input name="down_payment" type="number" min="0" step="0.01" defaultValue="0" /></FormField>
            <FormField>{t("discount")}<Input name="discount" type="number" min="0" step="0.01" defaultValue="0" /></FormField>
            <FormField>{t("expectedClose")}<Input name="expected_close_date" type="date" /></FormField>
            <FormField className="sm:col-span-2">{t("notes")}<Textarea name="notes" /></FormField>
          </FormGrid>
          <input type="hidden" name="currency" value="USD" />
          <Button className="w-fit">{t("createDeal")}</Button>
        </form>
      </CreatePanel>

      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>{t("contractRegister")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("contract")}</TableHead><TableHead>{t("customer")}</TableHead><TableHead>{t("asset")}</TableHead><TableHead>{t("paymentMethod")}</TableHead><TableHead>{t("contractValue")}</TableHead><TableHead>{t("outstanding")}</TableHead><TableHead>{t("status")}</TableHead></TableRow></TableHeader>
            <TableBody>{data.deals.map((deal) => {
              const summary = summaries.get(deal.id);
              return <TableRow key={deal.id}>
                <TableCell><span className="font-mono text-xs font-bold text-primary">{deal.contract_number}</span>{deal.expected_close_date && <span className="mt-1 block text-[10px] text-muted-foreground">{formatter.format(new Date(deal.expected_close_date))}</span>}</TableCell>
                <TableCell className="font-semibold">{contacts.get(deal.contact_id) ?? "—"}</TableCell>
                <TableCell>{(deal.property_id && properties.get(deal.property_id)) || data.projects.find((item) => item.id === deal.project_id)?.name || "—"}</TableCell>
                <TableCell><Badge variant="outline">{t(deal.payment_method)}</Badge></TableCell>
                <TableCell>{formatCurrency(Number(deal.total_value), deal.currency, locale)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(Number(summary?.outstanding_amount ?? 0), deal.currency, locale)}</TableCell>
                <TableCell><OperationalStatusForm locale={locale} table="deals" id={deal.id} value={deal.status} options={statuses} labels={labels} saveLabel={t("save")} /></TableCell>
              </TableRow>;
            })}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
