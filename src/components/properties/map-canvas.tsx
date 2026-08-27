"use client";

import L from "leaflet";
import { LocateFixed, MapPin, Ruler } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { PropertyMapItem } from "@/lib/domain";
import { formatCurrency, formatNumber } from "@/lib/utils";

const defaultCenter: [number, number] = [36.2058, 44.0073];

function FitProperties({ properties }: { properties: PropertyMapItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (!properties.length) return;
    if (properties.length === 1) {
      map.flyTo([properties[0].latitude, properties[0].longitude], 14, { duration: 0.75 });
      return;
    }

    const bounds = L.latLngBounds(
      properties.map((property) => [property.latitude, property.longitude] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.18), { animate: true, duration: 0.75, maxZoom: 14 });
  }, [map, properties]);

  return null;
}

function LocateControl() {
  const map = useMap();
  const t = useTranslations("Map");

  return (
    <div className="leaflet-top leaflet-end">
      <div className="leaflet-control m-3">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="rounded-xl shadow-xl"
          aria-label={t("locate")}
          onClick={() => {
            map.locate({ setView: true, maxZoom: 15 });
          }}
        >
          <LocateFixed aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export default function MapCanvas({ properties }: { properties: PropertyMapItem[] }) {
  const locale = useLocale();
  const propertyT = useTranslations("Property");
  const mapT = useTranslations("Map");

  const markers = useMemo(
    () =>
      properties.map((property) => ({
        property,
        icon: L.divIcon({
          className: "map-label-marker",
          html: `<span>${formatCurrency(property.price, property.currency, locale)}</span>`,
          iconSize: [1, 1],
          iconAnchor: [0, 0],
        }),
      })),
    [locale, properties],
  );

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      minZoom={3}
      maxZoom={19}
      zoomControl
      scrollWheelZoom
      className="h-full min-h-[520px] w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitProperties properties={properties} />
      <LocateControl />

      {markers.map(({ property, icon }) => (
        <Marker key={property.id} position={[property.latitude, property.longitude]} icon={icon}>
          <Popup closeButton>
            <article className="overflow-hidden rounded-[inherit]">
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <Image
                  src={property.image_url}
                  alt={property.localizedTitle}
                  fill
                  sizes="290px"
                  className="object-cover"
                />
                <Badge className="absolute start-3 top-3 bg-background/90 text-foreground backdrop-blur-sm">
                  {propertyT(property.property_type)}
                </Badge>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{property.localizedTitle}</h3>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3 text-primary" aria-hidden="true" />
                      {property.address}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-black text-primary">
                    {formatCurrency(property.price, property.currency, locale)}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Ruler className="size-3" aria-hidden="true" />
                    {formatNumber(property.area_m2, locale)} m²
                  </span>
                  <span>{property.payment_options.map((option) => propertyT(option)).join(" · ")}</span>
                </div>
                <Button asChild size="sm" className="mt-4 w-full">
                  <Link href={`/properties/${property.id}`}>{mapT("viewDetails")}</Link>
                </Button>
              </div>
            </article>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
