"use client";

import { CheckCircle2, LoaderCircle, Plus, Printer, ReceiptText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

import { ReceiptTemplate } from "@/components/admin/receipt-template";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { normalizeLocalizedText } from "@/lib/domain";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { receiptSchema } from "@/lib/validation";
import type { Database, PropertyRow, ReceiptRow } from "@/types/database";

type PaymentType = Database["public"]["Enums"]["payment_method"];
type ReceiptDraft = {
  property_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_type: PaymentType;
  amount: number;
  contract_total: number | null;
  payment_date: string;
  next_due_date: string | null;
  installment_number: number | null;
  notes: string;
  authorized_by: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyDraft: ReceiptDraft = {
  property_id: null,
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  payment_type: "cash",
  amount: 0,
  contract_total: null,
  payment_date: today(),
  next_due_date: null,
  installment_number: null,
  notes: "",
  authorized_by: "",
};

function asPreview(draft: ReceiptDraft): ReceiptRow {
  const balance = Math.max(0, (draft.contract_total ?? draft.amount) - draft.amount);
  const now = new Date().toISOString();
  return {
    id: "draft",
    receipt_number: "TWR-DRAFT",
    ...draft,
    customer_name: draft.customer_name || "—",
    authorized_by: draft.authorized_by || "—",
    balance_due: balance,
    currency: "USD",
    status: "issued",
    issued_by: null,
    created_at: now,
    updated_at: now,
  };
}

export function ReceiptStudio({
  initialReceipts,
  properties,
}: {
  initialReceipts: ReceiptRow[];
  properties: PropertyRow[];
}) {
  const locale = useLocale();
  const t = useTranslations("Receipts");
  const propertyT = useTranslations("Property");
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<ReceiptDraft>(emptyDraft);
  const [receipts, setReceipts] = useState(initialReceipts);
  const [generated, setGenerated] = useState<ReceiptRow | null>(initialReceipts[0] ?? null);
  const [saving, setSaving] = useState(false);

  const propertyNames = useMemo(
    () => new Map(properties.map((property) => {
      const title = normalizeLocalizedText(property.title);
      return [property.id, title[locale as keyof typeof title] || title.en];
    })),
    [locale, properties],
  );
  const preview = generated ?? asPreview(draft);

  const printA4 = useReactToPrint({
    contentRef: printRef,
    documentTitle: preview.receipt_number,
    pageStyle: "@page { size: A4; margin: 10mm; }",
  });
  const printThermal = useReactToPrint({
    contentRef: printRef,
    documentTitle: preview.receipt_number,
    pageStyle: `
      @page { size: 80mm auto; margin: 0; }
      @media print {
        .receipt-paper { width: 80mm !important; min-height: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; font-size: 10px !important; }
        .receipt-paper > div:last-child { padding: 5mm !important; }
        .receipt-notes { margin-top: 4mm !important; }
        .receipt-signatures { margin-top: 10mm !important; gap: 5mm !important; }
        .receipt-footer { margin-top: 8mm !important; }
      }
    `,
  });

  function update<K extends keyof ReceiptDraft>(key: K, value: ReceiptDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setGenerated(null);
  }

  async function saveReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = receiptSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(t("error"), { description: parsed.error.issues[0]?.message });
      return;
    }

    const supabase = createClient();
    if (!supabase) return toast.error(t("error"));
    const balance_due = Math.max(0, (parsed.data.contract_total ?? parsed.data.amount) - parsed.data.amount);
    setSaving(true);
    const { data, error } = await supabase
      .from("receipts")
      .insert({ ...parsed.data, balance_due, currency: "USD" })
      .select()
      .single();
    setSaving(false);

    if (error || !data) return toast.error(t("error"), { description: error?.message });
    setGenerated(data);
    setReceipts((current) => [data, ...current]);
    toast.success(t("saved"));
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em]">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="outline" onClick={() => { setDraft({ ...emptyDraft, payment_date: today() }); setGenerated(null); }}>
          <Plus aria-hidden="true" /> {t("new")}
        </Button>
      </div>

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(360px,.68fr)_minmax(620px,1.32fr)]">
        <Card className="2xl:sticky 2xl:top-20">
          <CardHeader><CardTitle>{t("new")}</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={saveReceipt}>
              <Field label={t("customer")} htmlFor="customer"><Input id="customer" value={draft.customer_name} onChange={(e) => update("customer_name", e.target.value)} required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("phone")} htmlFor="phone"><Input id="phone" dir="ltr" value={draft.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} /></Field>
                <Field label={t("date")} htmlFor="payment-date"><Input id="payment-date" type="date" value={draft.payment_date} onChange={(e) => update("payment_date", e.target.value)} required /></Field>
              </div>
              <Field label={t("address")} htmlFor="customer-address"><Input id="customer-address" value={draft.customer_address} onChange={(e) => update("customer_address", e.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{t("paymentType")}</Label>
                  <Select value={draft.payment_type} onValueChange={(value) => update("payment_type", value as PaymentType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(["cash", "installment", "advance"] as const).map((type) => <SelectItem key={type} value={type}>{propertyT(type)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Field label={t("amount")} htmlFor="paid"><Input id="paid" type="number" min="0.01" step="0.01" value={draft.amount || ""} onChange={(e) => update("amount", Number(e.target.value))} required /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("contractTotal")} htmlFor="contract-total"><Input id="contract-total" type="number" min="0.01" step="0.01" value={draft.contract_total ?? ""} onChange={(e) => update("contract_total", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label={t("installmentNumber")} htmlFor="installment"><Input id="installment" type="number" min="1" value={draft.installment_number ?? ""} onChange={(e) => update("installment_number", e.target.value ? Number(e.target.value) : null)} /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{t("property")}</Label>
                  <Select value={draft.property_id ?? "none"} onValueChange={(value) => update("property_id", value === "none" ? null : value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">{t("noProperty")}</SelectItem>{properties.map((property) => <SelectItem key={property.id} value={property.id}>{propertyNames.get(property.id)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Field label={t("dueDate")} htmlFor="due-date"><Input id="due-date" type="date" value={draft.next_due_date ?? ""} onChange={(e) => update("next_due_date", e.target.value || null)} /></Field>
              </div>
              <Field label={t("authorized")} htmlFor="authorized"><Input id="authorized" value={draft.authorized_by} onChange={(e) => update("authorized_by", e.target.value)} required /></Field>
              <Field label={t("notes")} htmlFor="receipt-notes"><Textarea id="receipt-notes" value={draft.notes} onChange={(e) => update("notes", e.target.value)} /></Field>
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                {saving ? t("saving") : t("generate")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="min-w-0">
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{t("preview")}</h2>
              {!generated ? <Badge className="mt-1" variant="outline">{t("draft")}</Badge> : null}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => printThermal()}><Printer aria-hidden="true" />{t("printThermal")}</Button>
              <Button onClick={() => printA4()}><Printer aria-hidden="true" />{t("printA4")}</Button>
            </div>
          </div>
          <ReceiptTemplate ref={printRef} locale={locale} receipt={preview} propertyName={preview.property_id ? propertyNames.get(preview.property_id) : undefined} />
        </section>
      </div>

      <Card className="no-print mt-6">
        <CardHeader><CardTitle>{t("title")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          {receipts.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>{t("number")}</TableHead><TableHead>{t("customer")}</TableHead><TableHead>{t("paymentType")}</TableHead><TableHead>{t("date")}</TableHead><TableHead className="text-end">{t("amount")}</TableHead></TableRow></TableHeader>
              <TableBody>{receipts.map((receipt) => (
                <TableRow key={receipt.id} className="cursor-pointer" onClick={() => setGenerated(receipt)}>
                  <TableCell className="font-mono text-xs font-semibold">{receipt.receipt_number}</TableCell>
                  <TableCell>{receipt.customer_name}</TableCell>
                  <TableCell><Badge variant="outline">{propertyT(receipt.payment_type)}</Badge></TableCell>
                  <TableCell>{new Intl.DateTimeFormat(locale === "ku" ? "ckb" : locale).format(new Date(`${receipt.payment_date}T12:00:00Z`))}</TableCell>
                  <TableCell className="text-end font-semibold">{formatCurrency(Number(receipt.amount), receipt.currency, locale)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          ) : <div className="grid place-items-center px-6 py-16 text-center"><ReceiptText className="size-9 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{t("subtitle")}</p></div>}
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
