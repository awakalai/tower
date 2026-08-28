import { PropertyManager } from "@/components/admin/property-manager";
import { getAdminProjects, getAdminProperties } from "@/lib/data/admin";
import { resolveSubmissionImageUrls } from "@/lib/storage/submission-images";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPropertiesPage() {
  const [properties, projects, supabase] = await Promise.all([
    getAdminProperties(),
    getAdminProjects(),
    createClient(),
  ]);
  const imagePreviews = supabase
    ? await resolveSubmissionImageUrls(
        supabase,
        properties.map((property) => property.image_url),
      )
    : {};

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <PropertyManager
        initialProperties={properties}
        projects={projects}
        imagePreviews={imagePreviews}
      />
    </main>
  );
}
