import { ArrowLeft, Banknote, Bath, BedDouble, Building2, CalendarClock, CarFront, Layers3, MapPin, Ruler } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { InquiryForm } from "@/components/properties/inquiry-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getPublicProperty } from "@/lib/data/properties";
import { formatCurrency, formatNumber } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/properties/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const property = await getPublicProperty(id, locale);
  if (!property) return {};
  return { title: property.localizedTitle, description: property.localizedDescription };
}

export default async function PropertyDetailsPage({
  params,
}: PageProps<"/[locale]/properties/[id]">) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [property, t, mapT] = await Promise.all([
    getPublicProperty(id, locale),
    getTranslations({ locale, namespace: "Property" }),
    getTranslations({ locale, namespace: "Map" }),
  ]);
  if (!property) notFound();
  const amenities = property.features && typeof property.features === "object" && !Array.isArray(property.features) && Array.isArray(property.features.amenities)
    ? property.features.amenities.filter((item): item is string => typeof item === "string")
    : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Button asChild variant="ghost" className="mb-5 -ms-3">
        <Link href="/">
          <ArrowLeft className="directional-icon" aria-hidden="true" />
          {t("backToMap")}
        </Link>
      </Button>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,.65fr)]">
        <section>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-muted shadow-premium">
            <Image
              src={property.image_url}
              alt={property.localizedTitle}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 70vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4 sm:p-6">
              <Badge className="bg-background/92 text-foreground backdrop-blur-md">
                {t(property.property_type)}
              </Badge>
              <Badge variant={property.status === "available" ? "success" : "secondary"}>
                {t(property.status)}
              </Badge>
            </div>
          </div>

          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
              {property.reference_code}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              {property.localizedTitle}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              {property.address}
            </p>
            <h2 className="mt-8 text-lg font-semibold">{t("description")}</h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-8 text-muted-foreground">
              {property.localizedDescription}
            </p>
            {property.property_type !== "land" && (
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border bg-card p-4"><BedDouble className="size-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">{t("bedrooms")}</p><p className="font-semibold">{property.bedrooms ?? "—"}</p></div>
                <div className="rounded-xl border bg-card p-4"><Bath className="size-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">{t("bathrooms")}</p><p className="font-semibold">{property.bathrooms ?? "—"}</p></div>
                <div className="rounded-xl border bg-card p-4"><Layers3 className="size-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">{t("floors")}</p><p className="font-semibold">{property.floors ?? "—"}</p></div>
                <div className="rounded-xl border bg-card p-4"><CarFront className="size-5 text-primary" /><p className="mt-2 text-xs text-muted-foreground">{t("parking")}</p><p className="font-semibold">{property.parking_spaces ?? "—"}</p></div>
              </div>
            )}
            {amenities.length > 0 && <div className="mt-7"><h2 className="text-lg font-semibold">{t("amenities")}</h2><div className="mt-3 flex flex-wrap gap-2">{amenities.map((amenity) => <Badge key={amenity} variant="outline" className="bg-card px-3 py-1.5">{amenity}</Badge>)}</div></div>}
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden shadow-premium">
            <CardHeader className="border-b bg-primary text-primary-foreground">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/70">
                {t("price")}
              </p>
              <CardTitle className="text-3xl font-black">
                {formatCurrency(property.price, property.currency, locale)}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 pt-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/65 p-4">
                  <Ruler className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-xs text-muted-foreground">{t("area")}</p>
                  <p className="mt-1 font-semibold">{formatNumber(property.area_m2, locale)} m²</p>
                </div>
                <div className="rounded-xl bg-muted/65 p-4">
                  <Building2 className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-xs text-muted-foreground">{mapT("type")}</p>
                  <p className="mt-1 font-semibold">{t(property.property_type)}</p>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Banknote className="size-4 text-primary" aria-hidden="true" />
                  {t("paymentOptions")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.payment_options.map((option) => (
                    <Badge key={option} variant="outline">{t(option)}</Badge>
                  ))}
                </div>
              </div>

              {property.status === "construction" && (
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <CalendarClock className="size-4 text-primary" aria-hidden="true" />
                    {property.completion_percent}%
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${property.completion_percent}%` }} />
                  </div>
                </div>
              )}

              <InquiryForm propertyId={property.id} organizationId={property.organization_id} locale={locale} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
