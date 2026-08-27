import { PropertyManager } from "@/components/admin/property-manager";
import { getAdminProjects, getAdminProperties } from "@/lib/data/admin";

export default async function AdminPropertiesPage() {
  const [properties, projects] = await Promise.all([getAdminProperties(), getAdminProjects()]);
  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <PropertyManager initialProperties={properties} projects={projects} />
    </main>
  );
}
