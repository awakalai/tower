import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ExpenseRow, PropertyRow, ReceiptRow } from "@/types/database";

export type DashboardData = {
  metrics: {
    totalProperties: number;
    availableUnits: number;
    revenue: number;
    expenses: number;
    pendingInstallments: number;
    completion: number;
  };
  cashFlow: Array<{ month: string; revenue: number; expense: number }>;
  portfolio: Array<{ status: PropertyRow["status"]; value: number }>;
  recentReceipts: ReceiptRow[];
};

const emptyDashboard: DashboardData = {
  metrics: {
    totalProperties: 0,
    availableUnits: 0,
    revenue: 0,
    expenses: 0,
    pendingInstallments: 0,
    completion: 0,
  },
  cashFlow: [],
  portfolio: [],
  recentReceipts: [],
};

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildMonthSeries(receipts: ReceiptRow[], expenses: ExpenseRow[]) {
  const now = new Date();
  const rows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    return { month: monthKey(date), revenue: 0, expense: 0 };
  });
  const index = new Map(rows.map((row) => [row.month, row]));

  receipts
    .filter((receipt) => receipt.status === "issued")
    .forEach((receipt) => {
      const row = index.get(receipt.payment_date.slice(0, 7));
      if (row) row.revenue += Number(receipt.amount);
    });

  expenses.forEach((expense) => {
    const row = index.get(expense.incurred_on.slice(0, 7));
    if (row) row.expense += Number(expense.amount);
  });

  return rows;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  if (!supabase) return emptyDashboard;

  const [propertiesResult, expensesResult, receiptsResult] = await Promise.all([
    supabase.from("properties").select("*"),
    supabase.from("expenses").select("*").order("incurred_on", { ascending: false }),
    supabase.from("receipts").select("*").order("payment_date", { ascending: false }),
  ]);

  const error = propertiesResult.error ?? expensesResult.error ?? receiptsResult.error;
  if (error) throw error;

  const properties = propertiesResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const receipts = receiptsResult.data ?? [];
  const issuedReceipts = receipts.filter((receipt) => receipt.status === "issued");

  const completion = properties.length
    ? Math.round(
        properties.reduce((total, property) => total + Number(property.completion_percent), 0) /
          properties.length,
      )
    : 0;

  const portfolio = (["available", "reserved", "construction", "sold"] as const).map(
    (status) => ({ status, value: properties.filter((property) => property.status === status).length }),
  );

  return {
    metrics: {
      totalProperties: properties.length,
      availableUnits: properties.filter((property) => property.status === "available").length,
      revenue: issuedReceipts.reduce((total, receipt) => total + Number(receipt.amount), 0),
      expenses: expenses.reduce((total, expense) => total + Number(expense.amount), 0),
      pendingInstallments: issuedReceipts.reduce(
        (total, receipt) => total + Number(receipt.balance_due),
        0,
      ),
      completion,
    },
    cashFlow: buildMonthSeries(issuedReceipts, expenses),
    portfolio,
    recentReceipts: issuedReceipts.slice(0, 6),
  };
}

export async function getAdminProperties() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAdminExpenses() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("incurred_on", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAdminReceipts() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .order("payment_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
