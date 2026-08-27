import { PropertyManager } from "@/components/admin/property-manager";
import { getAdminProperties } from "@/lib/data/admin";

export default async function AdminPropertiesPage() {
  const properties = await getAdminProperties();
  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <PropertyManager initialProperties={properties} />
    </main>
  );
}
