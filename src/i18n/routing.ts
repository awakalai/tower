import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ku", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export function isRtlLocale(locale: string) {
  return locale === "ku" || locale === "ar";
}
