import { ExpenseManager } from "@/components/admin/expense-manager";
import { getAdminExpenses, getAdminProperties } from "@/lib/data/admin";

export default async function AdminExpensesPage() {
  const [expenses, properties] = await Promise.all([getAdminExpenses(), getAdminProperties()]);
  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <ExpenseManager initialExpenses={expenses} properties={properties} />
    </main>
  );
}
