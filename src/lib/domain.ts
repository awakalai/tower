import type { AppLocale } from "@/i18n/routing";
import type { Json, PropertyRow } from "@/types/database";

export type LocalizedText = {
  en: string;
  ku: string;
  ar: string;
};

export type PropertyMapItem = Omit<
  PropertyRow,
  "title" | "description" | "location" | "created_by"
> & {
  title: LocalizedText;
  description: LocalizedText;
  localizedTitle: string;
  localizedDescription: string;
};

function isLocalizedText(value: Json): value is LocalizedText {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof value.en === "string" &&
      typeof value.ku === "string" &&
      typeof value.ar === "string",
  );
}

export function normalizeLocalizedText(value: Json): LocalizedText {
  if (isLocalizedText(value)) return value;
  const fallback = typeof value === "string" ? value : "";
  return { en: fallback, ku: fallback, ar: fallback };
}

export function localize(value: Json, locale: AppLocale) {
  const normalized = normalizeLocalizedText(value);
  return normalized[locale] || normalized.en;
}

export function toPropertyMapItem(row: PropertyRow, locale: AppLocale): PropertyMapItem {
  const title = normalizeLocalizedText(row.title);
  const description = normalizeLocalizedText(row.description);

  return {
    ...row,
    title,
    description,
    localizedTitle: title[locale] || title.en,
    localizedDescription: description[locale] || description.en,
  };
}
