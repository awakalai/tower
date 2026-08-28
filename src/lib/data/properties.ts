import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { demoProperties } from "@/lib/demo-data";
import { toPropertyMapItem } from "@/lib/domain";
import { signPropertyImages } from "@/lib/storage/submission-images";
import { createPublicClient } from "@/lib/supabase/server";

export async function getPublicProperties(locale: AppLocale) {
  const supabase = createPublicClient();
  if (!supabase) {
    return { properties: demoProperties.map((row) => toPropertyMapItem(row, locale)), demo: true };
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { properties: demoProperties.map((row) => toPropertyMapItem(row, locale)), demo: true };
  }

  const properties = await signPropertyImages(supabase, data ?? []);

  return {
    properties: properties.map((row) => toPropertyMapItem(row, locale)),
    demo: false,
  };
}

export async function getPublicProperty(id: string, locale: AppLocale) {
  const supabase = createPublicClient();
  if (!supabase) {
    const row = demoProperties.find((property) => property.id === id && property.is_published);
    return row ? toPropertyMapItem(row, locale) : null;
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  const [property] = await signPropertyImages(supabase, [data]);
  return toPropertyMapItem(property, locale);
}
