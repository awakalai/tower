import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  Building2,
  CircleDollarSign,
  Construction,
  HousePlug,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CashFlowChart, PortfolioChart } from "@/components/admin/dashboard-charts";
import { MetricCard } from "@/components/admin/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardData } from "@/lib/data/admin";
import { formatCurrency, toIntlLocale } from "@/lib/utils";

export default async function AdminDashboardPage({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  const [data, t, receiptT, propertyT] = await Promise.all([
    getDashboardData(),
    getTranslations({ locale, namespace: "Dashboard" }),
    getTranslations({ locale, namespace: "Receipts" }),
    getTranslations({ locale, namespace: "Property" }),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <div className="mb-7">
        <p className="text-xs font-black uppercase tracking-[.18em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label={t("totalProperties")} value={String(data.metrics.totalProperties)} icon={Building2} tone="brand" />
        <MetricCard label={t("availableUnits")} value={String(data.metrics.availableUnits)} icon={HousePlug} tone="success" />
        <MetricCard label={t("sales")} value={formatCurrency(data.metrics.revenue, "USD", locale)} icon={BanknoteArrowUp} tone="success" />
        <MetricCard label={t("expenses")} value={formatCurrency(data.metrics.expenses, "USD", locale)} icon={BanknoteArrowDown} tone="warning" />
        <MetricCard label={t("pending")} value={formatCurrency(data.metrics.pendingInstallments, "USD", locale)} icon={CircleDollarSign} tone="brand" />
        <MetricCard label={t("completion")} value={`${data.metrics.completion}%`} icon={Construction} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t("cashFlow")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={data.cashFlow} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("portfolio")}</CardTitle>
            <CardDescription>{t("totalProperties")}: {data.metrics.totalProperties}</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioChart data={data.portfolio} />
            <div className="mt-5 rounded-xl bg-muted/55 p-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
                <span>{t("completion")}</span>
                <span>{data.metrics.completion}%</span>
              </div>
              <Progress value={data.metrics.completion} />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("recent")}</CardTitle>
          <CardDescription>{receiptT("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {data.recentReceipts.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{receiptT("number")}</TableHead>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{receiptT("paymentType")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead className="text-end">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono text-xs font-semibold">{receipt.receipt_number}</TableCell>
                    <TableCell>{receipt.customer_name}</TableCell>
                    <TableCell><Badge variant="outline">{propertyT(receipt.payment_type)}</Badge></TableCell>
                    <TableCell>{new Intl.DateTimeFormat(toIntlLocale(locale)).format(new Date(receipt.payment_date))}</TableCell>
                    <TableCell className="text-end font-semibold">{formatCurrency(Number(receipt.amount), receipt.currency, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">{t("noReceipts")}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
