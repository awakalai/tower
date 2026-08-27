"use client";

import { Building2, LayoutDashboard, MapPinned, Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
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

const navigation = [
  { href: "/", key: "map", icon: MapPinned },
  { href: "/admin", key: "admin", icon: LayoutDashboard },
] as const;

function Brand() {
  const brand = useTranslations("Brand");
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_rgba(204,2,2,0.8)]">
        <Building2 className="size-5" aria-hidden="true" />
      </span>
      <span className="leading-none">
        <span className="block text-sm font-black tracking-[0.16em]">{brand("name")}</span>
        <span className="mt-1 block text-[10px] font-medium text-muted-foreground">
          {brand("descriptor")}
        </span>
      </span>
    </span>
  );
}

export function AppHeader() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[70] h-16 border-b bg-background/88 backdrop-blur-xl supports-[backdrop-filter]:bg-background/78">
      <div className="mx-auto flex h-full w-full max-w-[1800px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={t("map")}>
          <Brand />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navigation.map(({ href, key, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Button
                key={href}
                asChild
                variant={active ? "secondary" : "ghost"}
                size="sm"
                className={cn(active && "text-primary")}
              >
                <Link href={href}>
                  <Icon aria-hidden="true" />
                  {t(key)}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 sm:flex">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <Button asChild size="sm" className="ms-1">
            <Link href="/login">{t("signIn")}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t("openMenu")}>
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="end" className="flex flex-col">
              <SheetHeader>
                <SheetTitle>
                  <Brand />
                </SheetTitle>
                <SheetDescription className="sr-only">{t("openMenu")}</SheetDescription>
              </SheetHeader>
              <Separator className="my-5" />
              <nav className="grid gap-2">
                {navigation.map(({ href, key, icon: Icon }) => (
                  <SheetClose asChild key={href}>
                    <Button asChild variant="ghost" className="h-11 justify-start">
                      <Link href={href}>
                        <Icon aria-hidden="true" />
                        {t(key)}
                      </Link>
                    </Button>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto grid gap-3">
                <LanguageSwitcher />
                <SheetClose asChild>
                  <Button asChild>
                    <Link href="/login">{t("signIn")}</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
