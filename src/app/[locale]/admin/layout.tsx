import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  const supabase = await createClient();
  if (!supabase) redirect(`/${locale}/login`);

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect(`/${locale}/login`);

  const email = typeof data.claims.email === "string" ? data.claims.email : "Administrator";

  return (
    <div className="min-h-[calc(100svh-4rem)] bg-muted/20 lg:ps-64">
      <AdminSidebar email={email} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
