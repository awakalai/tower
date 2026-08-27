import "server-only";

import { headers } from "next/headers";

export async function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  if (host) return `${protocol}://${host}`;

  return "https://tower-bank14.vercel.app";
}
