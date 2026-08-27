"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Common");

  return (
    <main className="grid min-h-[calc(100svh-4rem)] place-items-center p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/12 text-destructive">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">{t("error")}</h1>
        <p className="mt-2 text-muted-foreground">{t("errorHint")}</p>
        <Button className="mt-6" onClick={reset}>
          <RefreshCw aria-hidden="true" />
          {t("retry")}
        </Button>
      </div>
    </main>
  );
}
