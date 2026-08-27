import { Building2, LogOut, PlusCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/[locale]/login/actions";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getPortalDestination } from "@/lib/auth/portal";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SellerLayout({
  children,
  params,
}: LayoutProps<"/[locale]/seller">) {
  const { locale } = await params;
  const supabase = await createClient();
  if (!supabase) redirect(`/${locale}/login`);

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect(`/${locale}/login`);

  const destination = await getPortalDestination(supabase, data.claims.sub);
  if (destination === "admin") redirect(`/${locale}/admin`);

  const t = await getTranslations({ locale, namespace: "Seller" });
  const email = typeof data.claims.email === "string" ? data.claims.email : "";

  return (
    <div className="min-h-[calc(100svh-4rem)] bg-muted/20">
      <div className="border-b bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/seller" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Building2 aria-hidden="true" /></span>
            <div><p className="text-sm font-bold">{t("portal")}</p><p className="text-xs text-muted-foreground">{email}</p></div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm"><Link href="/seller/new"><PlusCircle aria-hidden="true" />{t("newProperty")}</Link></Button>
            <form action={signOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="ghost" size="icon-sm" aria-label={t("signOut")}><LogOut aria-hidden="true" /></Button>
            </form>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
