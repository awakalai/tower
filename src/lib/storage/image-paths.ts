const uuidSegment = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const submissionImagePathPattern = new RegExp(
  `^${uuidSegment}/${uuidSegment}/${uuidSegment}\\.(?:jpg|jpeg|png|webp|avif)$`,
  "i",
);

export const PROPERTY_IMAGE_PLACEHOLDER = "/property-placeholder.svg";

export function isSubmissionImagePath(value: string) {
  return submissionImagePathPattern.test(value);
}
