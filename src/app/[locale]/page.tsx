import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PropertyExplorer } from "@/components/properties/property-explorer";
import { routing } from "@/i18n/routing";
import { getPublicProperties } from "@/lib/data/properties";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { properties, demo } = await getPublicProperties(locale);
  return <PropertyExplorer properties={properties} demo={demo} />;
}
