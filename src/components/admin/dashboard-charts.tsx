"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardData } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#CC0202", "#D49A1F", "#6B7280", "#147A54"];

export function CashFlowChart({ data }: { data: DashboardData["cashFlow"] }) {
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const formatted = data.map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat(locale === "ku" ? "ckb" : locale, {
      month: "short",
    }).format(new Date(`${item.month}-01T00:00:00Z`)),
  }));

  return (
    <div className="h-[280px] w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CC0202" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#CC0202" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--popover-foreground)",
            }}
            formatter={(value, name) => [
              formatCurrency(Number(value), "USD", locale),
              name === "revenue" ? t("revenue") : t("expense"),
            ]}
          />
          <Area type="monotone" dataKey="revenue" stroke="#CC0202" strokeWidth={2.5} fill="url(#revenueFill)" />
          <Area type="monotone" dataKey="expense" stroke="#6B7280" strokeWidth={2} fill="transparent" strokeDasharray="5 4" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PortfolioChart({ data }: { data: DashboardData["portfolio"] }) {
  const t = useTranslations("Property");
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const formatted = data.map((item) => ({ ...item, name: t(item.status) }));

  return (
    <div className="grid items-center gap-3 sm:grid-cols-[220px_1fr]">
      <div className="relative h-[220px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={formatted} dataKey="value" nameKey="name" innerRadius={66} outerRadius={92} paddingAngle={3} stroke="none">
              {formatted.map((entry, index) => <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--popover-foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-semibold">{total}</p>
            <p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">Total</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3">
        {formatted.map((item, index) => (
          <div key={item.status} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ background: COLORS[index] }} />
              {item.name}
            </span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
