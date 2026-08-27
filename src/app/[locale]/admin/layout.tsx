import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { EnterpriseTopbar } from "@/components/admin/enterprise-topbar";
import { getEnterpriseContext } from "@/lib/data/enterprise";
import { createClient } from "@/lib/supabase/server";
import { getPortalDestination } from "@/lib/auth/portal";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  const supabase = await createClient();
  if (!supabase) redirect(`/${locale}/login`);

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect(`/${locale}/login`);

  const destination = await getPortalDestination(supabase, data.claims.sub);
  if (destination !== "admin") redirect(`/${locale}/seller`);

  const email = typeof data.claims.email === "string" ? data.claims.email : "Administrator";
  const context = await getEnterpriseContext();

  return (
    <div className="min-h-[calc(100svh-4rem)] bg-muted/20 lg:ps-64">
      <AdminSidebar email={email} />
      <div className="min-w-0">
        <EnterpriseTopbar context={context} />
        {children}
      </div>
    </div>
  );
}
