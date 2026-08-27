import { ContactRound, Flame, Inbox, UserRoundCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createContactAction, createLeadAction } from "@/app/[locale]/admin/actions";
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
import { getCrmData } from "@/lib/data/enterprise";
import { normalizeLocalizedText } from "@/lib/domain";
import { formatCurrency, toIntlLocale } from "@/lib/utils";

const leadStatuses = ["new", "contacted", "qualified", "viewing", "negotiation", "won", "lost"] as const;
const inquiryStatuses = ["new", "contacted", "converted", "closed"] as const;
const sources = ["website", "referral", "social", "walk_in", "campaign", "portal", "other"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;

export default async function CrmPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [data, t] = await Promise.all([getCrmData(), getTranslations({ locale, namespace: "Enterprise" })]);
  const contacts = new Map(data.contacts.map((contact) => [contact.id, `${contact.first_name} ${contact.last_name}`.trim()]));
  const properties = new Map(data.properties.map((property) => {
    const title = normalizeLocalizedText(property.title);
    return [property.id, title[locale as keyof typeof title] || title.en];
  }));
  const leadLabels = Object.fromEntries(leadStatuses.map((status) => [status, t(status)]));
  const inquiryLabels = Object.fromEntries(inquiryStatuses.map((status) => [status, t(status)]));
  const active = data.leads.filter((lead) => !["won", "lost"].includes(lead.status));
  const pipeline = active.reduce((sum, lead) => sum + Number(lead.budget_max ?? lead.budget_min ?? 0), 0);
  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium" });

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow="CRM" title={t("crmTitle")} description={t("crmDescription")} icon={ContactRound} />
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("contacts")} value={String(data.contacts.length)} icon={ContactRound} tone="brand" />
        <MetricCard label={t("activeLeads")} value={String(active.length)} icon={Flame} tone="warning" />
        <MetricCard label={t("pipelineValue")} value={formatCurrency(pipeline, "USD", locale)} icon={UserRoundCheck} tone="success" />
        <MetricCard label={t("newInquiries")} value={String(data.inquiries.filter((item) => item.status === "new").length)} icon={Inbox} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <CreatePanel title={t("newContact")} description={t("newContactHint")}>
          <form action={createContactAction} className="grid gap-4">
            <input type="hidden" name="locale" value={locale} />
            <FormGrid>
              <FormField>{t("firstName")}<Input name="first_name" required minLength={2} /></FormField>
              <FormField>{t("lastName")}<Input name="last_name" /></FormField>
              <FormField>{t("phone")}<Input name="phone" type="tel" /></FormField>
              <FormField>{t("email")}<Input name="email" type="email" /></FormField>
              <FormField>{t("company")}<Input name="company_name" /></FormField>
              <FormField>{t("contactType")}<NativeSelect name="contact_type" defaultValue="buyer">{["buyer", "seller", "tenant", "landlord", "investor", "vendor", "partner"].map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
              <FormField>{t("source")}<NativeSelect name="source" defaultValue="walk_in">{sources.map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
              <FormField className="sm:col-span-2">{t("notes")}<Textarea name="notes" /></FormField>
            </FormGrid>
            <Button className="w-fit">{t("createContact")}</Button>
          </form>
        </CreatePanel>

        <CreatePanel title={t("newLead")} description={t("newLeadHint")}>
          <form action={createLeadAction} className="grid gap-4">
            <input type="hidden" name="locale" value={locale} />
            <FormGrid>
              <FormField>{t("contact")}<NativeSelect name="contact_id" required defaultValue=""><option value="" disabled>{t("select")}</option>{data.contacts.map((item) => <option value={item.id} key={item.id}>{contacts.get(item.id)}</option>)}</NativeSelect></FormField>
              <FormField>{t("status")}<NativeSelect name="status" defaultValue="new">{leadStatuses.map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
              <FormField>{t("source")}<NativeSelect name="source" defaultValue="walk_in">{sources.map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
              <FormField>{t("priority")}<NativeSelect name="priority" defaultValue="normal">{priorities.map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
              <FormField>{t("minimumBudget")}<Input name="budget_min" type="number" min="0" step="0.01" /></FormField>
              <FormField>{t("maximumBudget")}<Input name="budget_max" type="number" min="0" step="0.01" /></FormField>
              <FormField>{t("property")}<NativeSelect name="property_id" defaultValue=""><option value="">{t("none")}</option>{data.properties.map((item) => <option value={item.id} key={item.id}>{properties.get(item.id)}</option>)}</NativeSelect></FormField>
              <FormField>{t("project")}<NativeSelect name="project_id" defaultValue=""><option value="">{t("none")}</option>{data.projects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</NativeSelect></FormField>
              <FormField>{t("followUp")}<Input name="next_follow_up_at" type="datetime-local" /></FormField>
              <FormField className="sm:col-span-2">{t("notes")}<Textarea name="notes" /></FormField>
            </FormGrid>
            <input type="hidden" name="currency" value="USD" />
            <Button className="w-fit">{t("createLead")}</Button>
          </form>
        </CreatePanel>
      </section>

      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>{t("salesPipeline")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("contact")}</TableHead><TableHead>{t("source")}</TableHead><TableHead>{t("priority")}</TableHead><TableHead>{t("budget")}</TableHead><TableHead>{t("followUp")}</TableHead><TableHead>{t("status")}</TableHead></TableRow></TableHeader>
            <TableBody>{data.leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-semibold">{contacts.get(lead.contact_id) ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{t(lead.source)}</Badge></TableCell>
                <TableCell><Badge variant={lead.priority === "urgent" ? "destructive" : "secondary"}>{t(lead.priority)}</Badge></TableCell>
                <TableCell>{formatCurrency(Number(lead.budget_max ?? lead.budget_min ?? 0), lead.currency, locale)}</TableCell>
                <TableCell>{lead.next_follow_up_at ? formatter.format(new Date(lead.next_follow_up_at)) : "—"}</TableCell>
                <TableCell><OperationalStatusForm locale={locale} table="leads" id={lead.id} value={lead.status} options={leadStatuses} labels={leadLabels} saveLabel={t("save")} /></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>{t("websiteInquiries")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          {data.inquiries.length ? <Table>
            <TableHeader><TableRow><TableHead>{t("name")}</TableHead><TableHead>{t("contact")}</TableHead><TableHead>{t("property")}</TableHead><TableHead>{t("message")}</TableHead><TableHead>{t("status")}</TableHead></TableRow></TableHeader>
            <TableBody>{data.inquiries.map((inquiry) => <TableRow key={inquiry.id}>
              <TableCell className="font-semibold">{inquiry.name}</TableCell>
              <TableCell><span className="block">{inquiry.phone}</span><span className="text-xs text-muted-foreground">{inquiry.email}</span></TableCell>
              <TableCell>{properties.get(inquiry.property_id) ?? "—"}</TableCell>
              <TableCell className="max-w-64 truncate text-muted-foreground">{inquiry.message}</TableCell>
              <TableCell><OperationalStatusForm locale={locale} table="inquiries" id={inquiry.id} value={inquiry.status} options={inquiryStatuses} labels={inquiryLabels} saveLabel={t("save")} /></TableCell>
            </TableRow>)}</TableBody>
          </Table> : <p className="py-12 text-center text-sm text-muted-foreground">{t("noInquiries")}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
