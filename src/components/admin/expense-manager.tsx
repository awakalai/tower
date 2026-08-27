"use client";

import { CheckCircle2, CircleDollarSign, LoaderCircle, Plus, Receipt, WalletCards } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { normalizeLocalizedText } from "@/lib/domain";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { expenseSchema } from "@/lib/validation";
import type { Database, ExpenseRow, PropertyRow } from "@/types/database";

type Category = Database["public"]["Enums"]["expense_category"];
type ExpenseDraft = {
  property_id: string | null;
  category: Category;
  amount: number;
  incurred_on: string;
  vendor: string;
  notes: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyDraft: ExpenseDraft = {
  property_id: null,
  category: "materials",
  amount: 0,
  incurred_on: today(),
  vendor: "",
  notes: "",
};

export function ExpenseManager({
  initialExpenses,
  properties,
}: {
  initialExpenses: ExpenseRow[];
  properties: PropertyRow[];
}) {
  const locale = useLocale();
  const t = useTranslations("Expenses");
  const common = useTranslations("Common");
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const propertyNames = useMemo(
    () =>
      new Map(
        properties.map((property) => {
          const title = normalizeLocalizedText(property.title);
          return [property.id, title[locale as keyof typeof title] || title.en];
        }),
      ),
    [locale, properties],
  );

  async function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = expenseSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(t("error"), { description: parsed.error.issues[0]?.message });
      return;
    }

    const supabase = createClient();
    if (!supabase) return toast.error(t("error"));
    setSaving(true);
    const { data, error } = await supabase
      .from("expenses")
      .insert({ ...parsed.data, currency: "USD" })
      .select()
      .single();
    setSaving(false);

    if (error || !data) return toast.error(t("error"), { description: error?.message });
    setExpenses((current) => [data, ...current]);
    setDraft(emptyDraft);
    setOpen(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDraft({ ...emptyDraft, incurred_on: today() })}>
              <Plus aria-hidden="true" />
              {t("add")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={saveExpense}>
              <DialogHeader>
                <DialogTitle>{t("add")}</DialogTitle>
                <DialogDescription>{t("subtitle")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>{t("category")}</Label>
                    <Select value={draft.category} onValueChange={(category) => setDraft((current) => ({ ...current, category: category as Category }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["materials", "labor", "equipment", "permits", "operations", "other"] as const).map((category) => (
                          <SelectItem key={category} value={category}>{t(category)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expense-amount">{t("amount")}</Label>
                    <Input id="expense-amount" type="number" min="0.01" step="0.01" value={draft.amount || ""} onChange={(event) => setDraft((current) => ({ ...current, amount: Number(event.target.value) }))} required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="expense-date">{t("date")}</Label>
                    <Input id="expense-date" type="date" value={draft.incurred_on} onChange={(event) => setDraft((current) => ({ ...current, incurred_on: event.target.value }))} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="vendor">{t("vendor")}</Label>
                    <Input id="vendor" value={draft.vendor} onChange={(event) => setDraft((current) => ({ ...current, vendor: event.target.value }))} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>{t("property")}</Label>
                  <Select value={draft.property_id ?? "none"} onValueChange={(value) => setDraft((current) => ({ ...current, property_id: value === "none" ? null : value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("none")}</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>{propertyNames.get(property.id)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense-notes">{t("notes")}</Label>
                  <Textarea id="expense-notes" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{common("close")}</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                  {saving ? t("saving") : t("save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs text-muted-foreground">{t("total")}</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{formatCurrency(total, "USD", locale)}</p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><CircleDollarSign className="size-5" /></span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs text-muted-foreground">{t("title")}</p>
              <p className="mt-2 text-2xl font-semibold">{expenses.length}</p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-warning/10 text-warning"><WalletCards className="size-5" /></span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs text-muted-foreground">{t("category")}</p>
              <p className="mt-2 text-2xl font-semibold">{new Set(expenses.map((expense) => expense.category)).size}</p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground"><Receipt className="size-5" /></span>
          </CardContent>
        </Card>
      </section>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {expenses.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("vendor")}</TableHead>
                <TableHead>{t("property")}</TableHead>
                <TableHead className="text-end">{t("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Intl.DateTimeFormat(locale === "ku" ? "ckb" : locale).format(new Date(expense.incurred_on))}</TableCell>
                  <TableCell><Badge variant="outline">{t(expense.category)}</Badge></TableCell>
                  <TableCell className="font-medium">{expense.vendor}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">{expense.property_id ? propertyNames.get(expense.property_id) : t("none")}</TableCell>
                  <TableCell className="text-end font-semibold">{formatCurrency(Number(expense.amount), expense.currency, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="grid place-items-center px-6 py-20 text-center">
            <WalletCards className="size-9 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        )}
      </div>
    </>
  );
}
