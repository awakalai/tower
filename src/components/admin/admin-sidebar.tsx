"use client";

import {
  Building2,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ClipboardCheck,
  ContactRound,
  FolderKanban,
  FolderLock,
  Landmark,
  LogOut,
  MapPinned,
  ReceiptCent,
  Menu,
  ReceiptText,
  ScrollText,
  Settings2,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { signOutAction } from "@/app/[locale]/login/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", key: "overview", icon: ChartNoAxesCombined },
  { href: "/admin/properties", key: "properties", icon: Building2 },
  { href: "/admin/projects", key: "projects", icon: FolderKanban },
  { href: "/admin/crm", key: "crm", icon: ContactRound },
  { href: "/admin/deals", key: "deals", icon: BriefcaseBusiness },
  { href: "/admin/installments", key: "installments", icon: ReceiptCent },
  { href: "/admin/expenses", key: "expenses", icon: WalletCards },
  { href: "/admin/receipts", key: "receipts", icon: ReceiptText },
  { href: "/admin/tasks", key: "tasks", icon: ClipboardCheck },
  { href: "/admin/documents", key: "documents", icon: FolderLock },
  { href: "/admin/team", key: "team", icon: UsersRound },
  { href: "/admin/reports", key: "reports", icon: Landmark },
  { href: "/admin/audit", key: "audit", icon: ScrollText },
  { href: "/admin/settings", key: "settings", icon: Settings2 },
] as const;

function SidebarContent({ email, onNavigate }: { email: string; onNavigate?: boolean }) {
  const t = useTranslations("AdminNav");
  const auth = useTranslations("Auth");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="p-5">
        <p className="text-[10px] font-black uppercase tracking-[.2em] text-primary">TOWER</p>
        <h2 className="mt-1 text-sm font-semibold">{t("workspace")}</h2>
      </div>
      <Separator />
      <nav className="grid gap-1 overflow-y-auto p-3" aria-label={t("menu")}>
        {items.map(({ href, key, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          const content = (
            <Button
              asChild
              variant={active ? "secondary" : "ghost"}
              className={cn("h-10 justify-start", active && "text-primary")}
            >
              <Link href={href}>
                <Icon aria-hidden="true" />
                {t(key)}
              </Link>
            </Button>
          );
          return onNavigate ? <SheetClose asChild key={href}>{content}</SheetClose> : <div key={href}>{content}</div>;
        })}
      </nav>
      <div className="mt-auto p-3">
        <Separator className="mb-3" />
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/">
            <MapPinned aria-hidden="true" />
            {t("publicMap")}
          </Link>
        </Button>
        <div className="mt-3 rounded-lg bg-muted/60 p-3">
          <p className="truncate text-xs font-medium">{email}</p>
          <form action={signOutAction} className="mt-2">
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
              <LogOut aria-hidden="true" />
              {auth("signOut")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ email }: { email: string }) {
  const t = useTranslations("AdminNav");
  return (
    <>
      <aside className="fixed inset-y-16 start-0 z-40 hidden w-64 border-e bg-card/70 backdrop-blur-xl lg:block">
        <SidebarContent email={email} />
      </aside>
      <div className="fixed bottom-5 end-5 z-50 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full shadow-xl" aria-label={t("menu")}>
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="start" className="p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{t("menu")}</SheetTitle>
              <SheetDescription>{t("workspace")}</SheetDescription>
            </SheetHeader>
            <SidebarContent email={email} onNavigate />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
