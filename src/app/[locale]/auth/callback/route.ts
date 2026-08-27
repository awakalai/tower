import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function safeNext(candidate: string | null, locale: string) {
  const fallback = `/${locale}/seller`;
  if (!candidate || !candidate.startsWith(`/${locale}/`) || candidate.startsWith("//")) return fallback;
  return candidate;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"), locale);
  const redirectUrl = new URL(next, request.url);

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(redirectUrl);
    }
  }

  const errorUrl = new URL(`/${locale}/login`, request.url);
  errorUrl.searchParams.set("authError", "callback");
  return NextResponse.redirect(errorUrl);
}
