"use client";

import { CheckCircle2, Eye, EyeOff, LoaderCircle, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { normalizeLocalizedText } from "@/lib/domain";
import { isSubmissionImagePath, PROPERTY_IMAGE_PLACEHOLDER } from "@/lib/storage/image-paths";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { propertySchema } from "@/lib/validation";
import type { Database, ProjectRow, PropertyRow } from "@/types/database";

const LocationPickerMap = dynamic(() => import("./location-picker-map"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />,
});

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

type PropertyDraft = {
  title: { en: string; ku: string; ar: string };
  description: { en: string; ku: string; ar: string };
  property_type: PropertyRow["property_type"];
  status: PropertyRow["status"];
  price: number;
  area_m2: number;
  address: string;
  latitude: number;
  longitude: number;
  image_url: string;
  payment_options: PaymentMethod[];
  completion_percent: number;
  is_published: boolean;
  project_id: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  parking_spaces: number | null;
  year_built: number | null;
  features: string[];
  internal_notes: string;
};

const emptyDraft: PropertyDraft = {
  title: { en: "", ku: "", ar: "" },
  description: { en: "", ku: "", ar: "" },
  property_type: "apartment",
  status: "available",
  price: 0,
  area_m2: 0,
  address: "",
  latitude: 36.2058,
  longitude: 44.0073,
  image_url: "",
  payment_options: ["cash"],
  completion_percent: 100,
  is_published: true,
  project_id: null,
  bedrooms: null,
  bathrooms: null,
  floors: null,
  parking_spaces: null,
  year_built: null,
  features: [],
  internal_notes: "",
};

function draftFromProperty(property: PropertyRow): PropertyDraft {
  return {
    title: normalizeLocalizedText(property.title),
    description: normalizeLocalizedText(property.description),
    property_type: property.property_type,
    status: property.status,
    price: Number(property.price),
    area_m2: Number(property.area_m2),
    address: property.address,
    latitude: Number(property.latitude),
    longitude: Number(property.longitude),
    image_url: property.image_url,
    payment_options: property.payment_options,
    completion_percent: property.completion_percent,
    is_published: property.is_published,
    project_id: property.project_id,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    floors: property.floors,
    parking_spaces: property.parking_spaces,
    year_built: property.year_built,
    features: property.features && typeof property.features === "object" && !Array.isArray(property.features) && Array.isArray(property.features.amenities)
      ? property.features.amenities.filter((item): item is string => typeof item === "string")
      : [],
    internal_notes: property.internal_notes,
  };
}

export function PropertyManager({
  initialProperties,
  projects,
  imagePreviews,
}: {
  initialProperties: PropertyRow[];
  projects: ProjectRow[];
  imagePreviews: Record<string, string>;
}) {
  const locale = useLocale();
  const t = useTranslations("PropertiesAdmin");
  const common = useTranslations("Common");
  const propertyT = useTranslations("Property");
  const router = useRouter();
  const [properties, setProperties] = useState(initialProperties);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PropertyDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () => [...properties].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [properties],
  );

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  }

  function startEdit(property: PropertyRow) {
    setEditingId(property.id);
    setDraft(draftFromProperty(property));
    setOpen(true);
  }

  function togglePayment(method: PaymentMethod, checked: boolean) {
    setDraft((current) => ({
      ...current,
      payment_options: checked
        ? Array.from(new Set([...current.payment_options, method]))
        : current.payment_options.filter((item) => item !== method),
    }));
  }

  async function saveProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = propertySchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(t("error"), { description: parsed.error.issues[0]?.message });
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast.error(t("demoBlocked"));
      return;
    }

    setSaving(true);
    const { features, ...validated } = parsed.data;
    const existingProperty = editingId
      ? properties.find((property) => property.id === editingId)
      : null;
    const payload: Database["public"]["Tables"]["properties"]["Insert"] = {
      ...validated,
      features: { amenities: features },
      currency: "USD",
      gallery: [
        validated.image_url,
        ...(existingProperty?.gallery ?? []).filter(
          (image) => image !== validated.image_url && image !== existingProperty?.image_url,
        ),
      ],
    };

    const result = editingId
      ? await supabase.from("properties").update(payload).eq("id", editingId).select().single()
      : await supabase.from("properties").insert(payload).select().single();
    setSaving(false);

    if (result.error || !result.data) {
      toast.error(t("error"), { description: result.error?.message });
      return;
    }

    setProperties((current) =>
      editingId
        ? current.map((property) => (property.id === editingId ? result.data : property))
        : [result.data, ...current],
    );
    setOpen(false);
    toast.success(t("saved"));
    router.refresh();
  }

  async function deleteProperty(id: string) {
    const supabase = createClient();
    if (!supabase) return toast.error(t("demoBlocked"));
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(t("error"), { description: error.message });
    setProperties((current) => current.filter((property) => property.id !== id));
    toast.success(t("deleted"));
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em]">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startCreate}>
              <Plus aria-hidden="true" />
              {t("add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl p-0">
            <form onSubmit={saveProperty}>
              <DialogHeader className="border-b p-6">
                <DialogTitle>{editingId ? t("edit") : t("add")}</DialogTitle>
                <DialogDescription>{t("subtitle")}</DialogDescription>
              </DialogHeader>

              <div className="grid max-h-[calc(90vh-150px)] gap-6 overflow-y-auto p-6 lg:grid-cols-2">
                <div className="grid content-start gap-5">
                  <Tabs defaultValue="en">
                    <TabsList className="w-full">
                      <TabsTrigger value="en" className="flex-1">English</TabsTrigger>
                      <TabsTrigger value="ku" className="flex-1">کوردی</TabsTrigger>
                      <TabsTrigger value="ar" className="flex-1">العربية</TabsTrigger>
                    </TabsList>
                    {(["en", "ku", "ar"] as const).map((language) => (
                      <TabsContent value={language} key={language} className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor={`title-${language}`}>{t(language === "en" ? "titleEn" : language === "ku" ? "titleKu" : "titleAr")}</Label>
                          <Input
                            id={`title-${language}`}
                            value={draft.title[language]}
                            dir={language === "en" ? "ltr" : "rtl"}
                            onChange={(event) => setDraft((current) => ({ ...current, title: { ...current.title, [language]: event.target.value } }))}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`description-${language}`}>{t(language === "en" ? "descriptionEn" : language === "ku" ? "descriptionKu" : "descriptionAr")}</Label>
                          <Textarea
                            id={`description-${language}`}
                            value={draft.description[language]}
                            dir={language === "en" ? "ltr" : "rtl"}
                            onChange={(event) => setDraft((current) => ({ ...current, description: { ...current.description, [language]: event.target.value } }))}
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>{t("type")}</Label>
                      <Select value={draft.property_type} onValueChange={(property_type) => setDraft((current) => ({ ...current, property_type: property_type as PropertyDraft["property_type"] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="land">{propertyT("land")}</SelectItem>
                          <SelectItem value="house">{propertyT("house")}</SelectItem>
                          <SelectItem value="apartment">{propertyT("apartment")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("status")}</Label>
                      <Select value={draft.status} onValueChange={(status) => setDraft((current) => ({ ...current, status: status as PropertyDraft["status"] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">{propertyT("available")}</SelectItem>
                          <SelectItem value="reserved">{propertyT("reserved")}</SelectItem>
                          <SelectItem value="construction">{propertyT("construction")}</SelectItem>
                          <SelectItem value="sold">{propertyT("sold")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="price">{t("price")}</Label>
                      <Input id="price" type="number" min="1" value={draft.price || ""} onChange={(event) => setDraft((current) => ({ ...current, price: Number(event.target.value) }))} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="area">{t("area")}</Label>
                      <Input id="area" type="number" min="1" step="0.01" value={draft.area_m2 || ""} onChange={(event) => setDraft((current) => ({ ...current, area_m2: Number(event.target.value) }))} required />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">{t("address")}</Label>
                    <Input id="address" value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="image">{t("image")}</Label>
                    <Input id="image" type="text" value={draft.image_url} onChange={(event) => setDraft((current) => ({ ...current, image_url: event.target.value }))} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("project")}</Label>
                    <Select value={draft.project_id ?? "none"} onValueChange={(project_id) => setDraft((current) => ({ ...current, project_id: project_id === "none" ? null : project_id }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="none">{t("noProject")}</SelectItem>{projects.map((project) => <SelectItem value={project.id} key={project.id}>{project.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {(["bedrooms", "bathrooms", "floors", "parking_spaces", "year_built"] as const).map((field) => (
                      <div className="grid gap-2" key={field}>
                        <Label htmlFor={field}>{t(field === "parking_spaces" ? "parking" : field === "year_built" ? "yearBuilt" : field)}</Label>
                        <Input id={field} type="number" min="0" value={draft[field] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value ? Number(event.target.value) : null }))} />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2"><Label htmlFor="features">{t("features")}</Label><Input id="features" value={draft.features.join(", ")} onChange={(event) => setDraft((current) => ({ ...current, features: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder={t("featuresHint")} /></div>
                  <div className="grid gap-2"><Label htmlFor="internal-notes">{t("internalNotes")}</Label><Textarea id="internal-notes" value={draft.internal_notes} onChange={(event) => setDraft((current) => ({ ...current, internal_notes: event.target.value }))} /></div>
                </div>

                <div className="grid content-start gap-5">
                  <div>
                    <LocationPickerMap
                      latitude={draft.latitude}
                      longitude={draft.longitude}
                      onChange={(latitude, longitude) => setDraft((current) => ({ ...current, latitude, longitude }))}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">{t("pinHint")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="latitude">{t("latitude")}</Label>
                      <Input id="latitude" type="number" step="0.000001" value={draft.latitude} onChange={(event) => setDraft((current) => ({ ...current, latitude: Number(event.target.value) }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="longitude">{t("longitude")}</Label>
                      <Input id="longitude" type="number" step="0.000001" value={draft.longitude} onChange={(event) => setDraft((current) => ({ ...current, longitude: Number(event.target.value) }))} />
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <Label>{t("payments")}</Label>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {(["cash", "installment", "advance"] as const).map((method) => (
                        <label key={method} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox checked={draft.payment_options.includes(method)} onCheckedChange={(checked) => togglePayment(method, checked === true)} />
                          {propertyT(method)}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="completion">{t("status")} — {draft.completion_percent}%</Label>
                    <Input id="completion" type="range" min="0" max="100" value={draft.completion_percent} onChange={(event) => setDraft((current) => ({ ...current, completion_percent: Number(event.target.value) }))} className="px-0" />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
                    <div>
                      <Label htmlFor="published">{t("published")}</Label>
                      <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>
                    </div>
                    <Switch id="published" checked={draft.is_published} onCheckedChange={(is_published) => setDraft((current) => ({ ...current, is_published }))} />
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t p-5">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                  {saving ? t("saving") : t("save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {sorted.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("titleEn")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("area")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead className="text-center">{t("published")}</TableHead>
                <TableHead className="w-20 text-end">{common("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((property) => {
                const title = normalizeLocalizedText(property.title);
                const localizedTitle = title[locale as keyof typeof title] || title.en;
                const imageSource = imagePreviews[property.image_url]
                  ?? (isSubmissionImagePath(property.image_url)
                    ? PROPERTY_IMAGE_PLACEHOLDER
                    : property.image_url);
                return (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex min-w-[230px] items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image src={imageSource} alt="" fill sizes="44px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{localizedTitle}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{property.reference_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{propertyT(property.property_type)}</Badge></TableCell>
                    <TableCell><Badge variant={property.status === "available" ? "success" : "secondary"}>{propertyT(property.status)}</Badge></TableCell>
                    <TableCell>{formatNumber(Number(property.area_m2), locale)} m²</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(property.price), property.currency, locale)}</TableCell>
                    <TableCell className="text-center">{property.is_published ? <Eye className="mx-auto size-4 text-success" /> : <EyeOff className="mx-auto size-4 text-muted-foreground" />}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => startEdit(property)} aria-label={common("edit")}>
                          <Pencil aria-hidden="true" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={common("delete")}>
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteProperty(property.id)}>{t("delete")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="grid place-items-center px-6 py-20 text-center">
            <MoreHorizontal className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
            <Button className="mt-5" onClick={startCreate}><Plus aria-hidden="true" />{t("add")}</Button>
          </div>
        )}
      </div>
    </>
  );
}
