"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";

const labels = {
  en: "English",
  ku: "کوردی",
  ar: "العربية",
} as const;

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={locale}
      disabled={pending}
      onValueChange={(nextLocale) => {
        startTransition(() => {
          router.replace(pathname, { locale: nextLocale });
        });
      }}
    >
      <SelectTrigger
        aria-label={t("language")}
        className={compact ? "h-8 w-[104px] border-0 bg-transparent shadow-none" : "w-[138px]"}
      >
        <span className="flex items-center gap-2">
          <Languages className="size-4 text-primary" aria-hidden="true" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {Object.entries(labels).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
