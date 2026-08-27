import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en",
) {
  return new Intl.NumberFormat(locale === "ku" ? "ckb" : locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale = "en") {
  return new Intl.NumberFormat(locale === "ku" ? "ckb" : locale, {
    maximumFractionDigits: 2,
  }).format(value);
}
