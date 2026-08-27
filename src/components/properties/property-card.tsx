"use client";

import { motion } from "framer-motion";
import { ArrowRight, BedDouble, MapPin, Ruler } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { PropertyMapItem } from "@/lib/domain";
import { formatCurrency, formatNumber } from "@/lib/utils";

const statusVariants = {
  available: "success",
  reserved: "warning",
  sold: "secondary",
  construction: "outline",
} as const;

export function PropertyCard({ property }: { property: PropertyMapItem }) {
  const locale = useLocale();
  const t = useTranslations("Property");
  const mapT = useTranslations("Map");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="group overflow-hidden rounded-xl border bg-card shadow-[0_16px_45px_-38px_rgba(0,0,0,.75)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={property.image_url}
          alt={property.localizedTitle}
          fill
          sizes="(max-width: 768px) 100vw, 340px"
          className="object-cover transition duration-500 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm" variant="outline">
            {t(property.property_type)}
          </Badge>
          <Badge variant={statusVariants[property.status]}>{t(property.status)}</Badge>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-tight">{property.localizedTitle}</h3>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              {property.address}
            </p>
          </div>
          <p className="shrink-0 text-sm font-black text-primary">
            {formatCurrency(property.price, property.currency, locale)}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Ruler className="size-3.5" aria-hidden="true" />
            {formatNumber(property.area_m2, locale)} m²
          </span>
          {property.property_type !== "land" && (
            <span className="flex items-center gap-1.5">
              <BedDouble className="size-3.5" aria-hidden="true" />
              {t(property.property_type)}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
          <div className="flex min-w-0 gap-1">
            {property.payment_options.slice(0, 2).map((option) => (
              <span key={option} className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold">
                {t(option)}
              </span>
            ))}
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0 text-primary">
            <Link href={`/properties/${property.id}`}>
              {mapT("viewDetails")}
              <ArrowRight className="directional-icon" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
