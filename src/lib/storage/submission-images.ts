import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isSubmissionImagePath,
  PROPERTY_IMAGE_PLACEHOLDER,
} from "@/lib/storage/image-paths";
import type { Database, PropertyRow } from "@/types/database";

const submissionBucket = "property-submissions";
const signedUrlLifetimeSeconds = 60 * 60;

export async function resolveSubmissionImageUrls(
  supabase: SupabaseClient<Database>,
  values: string[],
) {
  const uniqueValues = Array.from(new Set(values));
  const resolved: Record<string, string> = Object.fromEntries(
    uniqueValues.map((value) => [
      value,
      isSubmissionImagePath(value) ? PROPERTY_IMAGE_PLACEHOLDER : value,
    ]),
  );
  const paths = uniqueValues.filter(isSubmissionImagePath);

  if (!paths.length) return resolved;

  const { data, error } = await supabase.storage
    .from(submissionBucket)
    .createSignedUrls(paths, signedUrlLifetimeSeconds);

  if (error || !data) return resolved;

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) {
      resolved[item.path] = item.signedUrl;
    }
  }

  return resolved;
}

export async function signPropertyImages(
  supabase: SupabaseClient<Database>,
  properties: PropertyRow[],
) {
  const imageValues = properties.flatMap((property) => [
    property.image_url,
    ...property.gallery,
  ]);
  const resolved = await resolveSubmissionImageUrls(supabase, imageValues);

  return properties.map((property) => ({
    ...property,
    image_url: resolved[property.image_url] ?? PROPERTY_IMAGE_PLACEHOLDER,
    gallery: property.gallery.map(
      (image) => resolved[image] ?? PROPERTY_IMAGE_PLACEHOLDER,
    ),
  }));
}
