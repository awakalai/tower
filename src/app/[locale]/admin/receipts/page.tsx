import { ReceiptStudio } from "@/components/admin/receipt-studio";
import { getAdminProperties, getAdminReceipts } from "@/lib/data/admin";

export default async function AdminReceiptsPage() {
  const [receipts, properties] = await Promise.all([getAdminReceipts(), getAdminProperties()]);
  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <ReceiptStudio initialReceipts={receipts} properties={properties} />
    </main>
  );
}
