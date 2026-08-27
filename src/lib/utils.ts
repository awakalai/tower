import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Chromium and Node ship different ICU coverage for Sorani (`ckb`), which can
// otherwise produce different numerals during hydration. Keep Sorani numbers
// deterministic while the translated interface itself remains fully Kurdish.
export function toIntlLocale(locale: string) {
  return locale === "ku" ? "en-US" : locale;
}

export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en",
) {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale = "en") {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    maximumFractionDigits: 2,
  }).format(value);
}
