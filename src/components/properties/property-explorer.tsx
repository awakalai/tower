"use client";

import { AnimatePresence } from "framer-motion";
import { Filter, List, Map as MapIcon, RotateCcw, SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { PropertyCard } from "@/components/properties/property-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import type { PropertyMapItem } from "@/lib/domain";
import { formatCurrency } from "@/lib/utils";

const MapCanvas = dynamic(() => import("./map-canvas"), {
  ssr: false,
  loading: () => <div className="h-full min-h-[520px] animate-pulse bg-muted" />,
});

type Filters = {
  type: "all" | PropertyMapItem["property_type"];
  status: "all" | PropertyMapItem["status"];
  maxPrice: number;
};

function FilterFields({
  filters,
  setFilters,
  ceiling,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  ceiling: number;
}) {
  const locale = useLocale();
  const t = useTranslations("Map");
  const propertyT = useTranslations("Property");

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
          {t("type")}
          <Select
            value={filters.type}
            onValueChange={(type) => setFilters((current) => ({ ...current, type: type as Filters["type"] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTypes")}</SelectItem>
              <SelectItem value="land">{propertyT("land")}</SelectItem>
              <SelectItem value="house">{propertyT("house")}</SelectItem>
              <SelectItem value="apartment">{propertyT("apartment")}</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
          {t("status")}
          <Select
            value={filters.status}
            onValueChange={(status) =>
              setFilters((current) => ({ ...current, status: status as Filters["status"] }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="available">{propertyT("available")}</SelectItem>
              <SelectItem value="reserved">{propertyT("reserved")}</SelectItem>
              <SelectItem value="construction">{propertyT("construction")}</SelectItem>
              <SelectItem value="sold">{propertyT("sold")}</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold">
          <span className="text-muted-foreground">{t("priceRange")}</span>
          <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
            {filters.maxPrice === ceiling
              ? t("anyPrice")
              : formatCurrency(filters.maxPrice, "USD", locale)}
          </span>
        </div>
        <Slider
          min={0}
          max={ceiling}
          step={10_000}
          value={[filters.maxPrice]}
          onValueChange={([maxPrice]) => setFilters((current) => ({ ...current, maxPrice }))}
          aria-label={t("priceRange")}
        />
      </div>
    </div>
  );
}

export function PropertyExplorer({
  properties,
  demo,
}: {
  properties: PropertyMapItem[];
  demo: boolean;
}) {
  const t = useTranslations("Map");
  const ceiling = Math.max(500_000, Math.ceil(Math.max(...properties.map((item) => item.price), 0) / 50_000) * 50_000);
  const [view, setView] = useState<"map" | "list">("map");
  const [filters, setFilters] = useState<Filters>({ type: "all", status: "all", maxPrice: ceiling });

  const filtered = useMemo(
    () =>
      properties.filter(
        (property) =>
          (filters.type === "all" || property.property_type === filters.type) &&
          (filters.status === "all" || property.status === filters.status) &&
          property.price <= filters.maxPrice,
      ),
    [filters, properties],
  );

  const clearFilters = () => setFilters({ type: "all", status: "all", maxPrice: ceiling });

  return (
    <main className="relative h-[calc(100svh-4rem)] min-h-[620px] overflow-hidden bg-background">
      <div className="grid h-full lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="relative z-20 hidden h-full min-h-0 flex-col border-e bg-background lg:flex">
          <div className="border-b p-5">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline" className="border-primary/20 bg-primary/8 text-primary">
                <MapIcon className="size-3.5" aria-hidden="true" />
                {t("eyebrow")}
              </Badge>
              {demo && <span className="text-[10px] font-semibold text-muted-foreground">{t("demoNotice")}</span>}
            </div>
            <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.035em]">{t("title")}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="border-b p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
                  {t("filters")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("filterHint")}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={clearFilters} aria-label={t("clear")}>
                <RotateCcw aria-hidden="true" />
              </Button>
            </div>
            <FilterFields filters={filters} setFilters={setFilters} ceiling={ceiling} />
          </div>

          <div className="flex items-center justify-between border-b px-5 py-3">
            <p className="text-xs font-semibold text-muted-foreground">{t("results", { count: filtered.length })}</p>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-[11px] text-primary">
              {t("clear")}
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {filtered.length ? (
              <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <Card className="border-dashed bg-muted/30 text-center">
                <CardHeader>
                  <CardTitle>{t("empty")}</CardTitle>
                  <CardDescription>{t("emptyHint")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={clearFilters}>{t("clear")}</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </aside>

        <section className="relative min-h-0 overflow-hidden">
          <div className="absolute inset-0">
            <MapCanvas properties={filtered} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-[45] p-3 lg:hidden">
            <div className="glass-panel pointer-events-auto rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-2 border-primary/20 bg-primary/8 text-primary">
                    {t("eyebrow")}
                  </Badge>
                  <h1 className="max-w-[310px] text-xl font-semibold leading-tight tracking-[-0.03em]">{t("title")}</h1>
                  <p className="mt-1 text-xs text-muted-foreground">{t("results", { count: filtered.length })}</p>
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="secondary" size="icon" aria-label={t("filters")}>
                      <Filter aria-hidden="true" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-2xl">
                    <SheetHeader>
                      <SheetTitle>{t("filters")}</SheetTitle>
                      <SheetDescription>{t("filterHint")}</SheetDescription>
                    </SheetHeader>
                    <div className="py-6">
                      <FilterFields filters={filters} setFilters={setFilters} ceiling={ceiling} />
                    </div>
                    <Button variant="outline" className="w-full" onClick={clearFilters}>
                      <RotateCcw aria-hidden="true" />
                      {t("clear")}
                    </Button>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 start-1/2 z-[45] -translate-x-1/2 lg:hidden">
            <div className="glass-panel flex rounded-full p-1">
              <Button
                size="sm"
                variant={view === "map" ? "default" : "ghost"}
                className="rounded-full"
                onClick={() => setView("map")}
              >
                <MapIcon aria-hidden="true" />
                {t("mapView")}
              </Button>
              <Button
                size="sm"
                variant={view === "list" ? "default" : "ghost"}
                className="rounded-full"
                onClick={() => setView("list")}
              >
                <List aria-hidden="true" />
                {t("listView")}
              </Button>
            </div>
          </div>

          {view === "list" && (
            <div className="absolute inset-0 z-[40] overflow-y-auto bg-background px-3 pb-24 pt-40 lg:hidden">
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
