import { MapPinOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("Common");
  const nav = useTranslations("Nav");

  return (
    <main className="grid min-h-[calc(100svh-4rem)] place-items-center p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MapPinOff className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">{t("notFound")}</h1>
        <p className="mt-2 text-muted-foreground">{t("notFoundHint")}</p>
        <Button asChild className="mt-6">
          <Link href="/">{nav("map")}</Link>
        </Button>
      </div>
    </main>
  );
}
