"use client";

import { CheckCircle2, Crosshair, ImagePlus, LoaderCircle, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import LocationPickerMap from "@/components/admin/location-picker-map";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-form";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const imageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;
const maxImageBytes = 8 * 1024 * 1024;

function optionalNumber(formData: FormData, key: string) {
  const candidate = String(formData.get(key) ?? "").trim();
  return candidate ? Number(candidate) : null;
}

function fileExtension(file: File) {
  return imageExtensions[file.type as keyof typeof imageExtensions] ?? "jpg";
}

export function PropertySubmissionForm({
  userId,
  locale,
  initialName,
  initialPhone,
  initialEmail,
}: {
  userId: string;
  locale: "en" | "ku" | "ar";
  initialName: string;
  initialPhone: string;
  initialEmail: string;
}) {
  const t = useTranslations("Seller");
  const propertyT = useTranslations("Property");
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<Array<"cash" | "installment" | "advance">>(["cash"]);
  const [latitude, setLatitude] = useState(36.2058);
  const [longitude, setLongitude] = useState(44.0073);
  const [busy, setBusy] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function chooseFiles(selected: FileList | null) {
    const next = Array.from(selected ?? []).slice(0, 12);
    if (next.some((file) => !imageTypes.has(file.type) || file.size > maxImageBytes)) {
      toast.error(t("invalidImages"));
      return;
    }
    setFiles(next);
  }

  function togglePayment(method: "cash" | "installment" | "advance", checked: boolean) {
    setPaymentOptions((current) => checked
      ? Array.from(new Set([...current, method]))
      : current.filter((item) => item !== method));
  }

  function locate() {
    if (!navigator.geolocation) return toast.error(t("locationError"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLatitude(coords.latitude); setLongitude(coords.longitude); },
      () => toast.error(t("locationError")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length) return toast.error(t("imagesRequired"));
    if (!paymentOptions.length) return toast.error(t("paymentRequired"));

    const supabase = createClient();
    if (!supabase) return toast.error(t("submissionError"));
    const formData = new FormData(event.currentTarget);
    const submissionId = crypto.randomUUID();
    const paths = files.map((file) => `${userId}/${submissionId}/${crypto.randomUUID()}.${fileExtension(file)}`);

    setBusy(true);
    setUploadMessage(t("uploadingPhotos"));
    const uploads = await Promise.all(files.map((file, index) =>
      supabase.storage.from("property-submissions").upload(paths[index], file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      }),
    ));
    const uploadError = uploads.find((upload) => upload.error)?.error;
    if (uploadError) {
      const completed = uploads.flatMap((upload, index) => upload.error ? [] : [paths[index]]);
      if (completed.length) await supabase.storage.from("property-submissions").remove(completed);
      setBusy(false);
      setUploadMessage("");
      toast.error(t("submissionError"), { description: uploadError.message });
      return;
    }

    const features = String(formData.get("features") ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 50);
    const payload: Database["public"]["Tables"]["property_submissions"]["Insert"] = {
      id: submissionId,
      submission_locale: locale,
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      property_type: String(formData.get("property_type")) as "land" | "house" | "apartment",
      price: Number(formData.get("price")),
      currency: "USD",
      area_m2: Number(formData.get("area_m2")),
      address: String(formData.get("address") ?? "").trim(),
      latitude,
      longitude,
      image_urls: paths,
      payment_options: paymentOptions,
      contact_name: String(formData.get("contact_name") ?? "").trim(),
      contact_phone: String(formData.get("contact_phone") ?? "").trim(),
      contact_email: String(formData.get("contact_email") ?? "").trim(),
      bedrooms: optionalNumber(formData, "bedrooms"),
      bathrooms: optionalNumber(formData, "bathrooms"),
      floors: optionalNumber(formData, "floors"),
      parking_spaces: optionalNumber(formData, "parking_spaces"),
      year_built: optionalNumber(formData, "year_built"),
      features,
    };

    setUploadMessage(t("sendingForReview"));
    const { error } = await supabase.from("property_submissions").insert(payload);
    if (error) {
      await supabase.storage.from("property-submissions").remove(paths);
      setBusy(false);
      setUploadMessage("");
      toast.error(t("submissionError"), { description: error.message });
      return;
    }

    toast.success(t("submittedSuccess"));
    router.push(`/${locale}/seller?submitted=1`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">01</p><h2 className="mt-1 text-xl font-semibold">{t("propertyDetails")}</h2></div>
        <div className="grid gap-5">
          <div className="grid gap-2"><Label htmlFor="submission-title">{t("propertyTitle")}</Label><Input id="submission-title" name="title" minLength={2} maxLength={120} required placeholder={t("propertyTitleHint")} /></div>
          <div className="grid gap-2"><Label htmlFor="submission-description">{t("description")}</Label><Textarea id="submission-description" name="description" maxLength={4000} rows={5} placeholder={t("descriptionHint")} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2"><Label htmlFor="property_type">{t("propertyType")}</Label><NativeSelect id="property_type" name="property_type" defaultValue="land" required><option value="land">{propertyT("land")}</option><option value="house">{propertyT("house")}</option><option value="apartment">{propertyT("apartment")}</option></NativeSelect></div>
            <div className="grid gap-2"><Label htmlFor="price">{t("price")}</Label><Input id="price" name="price" type="number" min="1" max="999999999" step="0.01" required dir="ltr" /></div>
            <div className="grid gap-2"><Label htmlFor="area_m2">{t("area")}</Label><Input id="area_m2" name="area_m2" type="number" min="1" max="10000000" step="0.01" required dir="ltr" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {(["bedrooms", "bathrooms", "floors", "parking_spaces", "year_built"] as const).map((field) => <div className="grid gap-2" key={field}><Label htmlFor={field}>{t(field)}</Label><Input id={field} name={field} type="number" min={field === "year_built" ? 1800 : 0} max={field === "year_built" ? 2200 : field === "parking_spaces" ? 1000 : 200} dir="ltr" /></div>)}
          </div>
          <div className="grid gap-2"><Label htmlFor="features">{t("features")}</Label><Input id="features" name="features" maxLength={1000} placeholder={t("featuresHint")} /></div>
          <div className="rounded-xl border bg-muted/20 p-4"><Label>{t("paymentOptions")}</Label><div className="mt-3 flex flex-wrap gap-5">{(["cash", "installment", "advance"] as const).map((method) => <label key={method} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={paymentOptions.includes(method)} onCheckedChange={(checked) => togglePayment(method, checked === true)} />{propertyT(method)}</label>)}</div></div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">02</p><h2 className="mt-1 text-xl font-semibold">{t("photos")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("photosHint")}</p></div>
        <label htmlFor="property-photos" className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/25 bg-primary/[.03] px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/[.05]"><ImagePlus className="size-8 text-primary" aria-hidden="true" /><span className="mt-3 font-semibold">{t("choosePhotos")}</span><span className="mt-1 text-xs text-muted-foreground">{t("photoRules")}</span><input id="property-photos" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(event) => chooseFiles(event.target.files)} /></label>
        {previews.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{previews.map((preview, index) => <div key={`${preview.file.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"><Image src={preview.url} alt="" fill sizes="(max-width: 640px) 50vw, 160px" unoptimized className="object-cover" /><button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute end-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 text-destructive shadow" aria-label={t("removePhoto")}><Trash2 className="size-4" aria-hidden="true" /></button>{index === 0 && <span className="absolute bottom-2 start-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">{t("primaryPhoto")}</span>}</div>)}</div>}
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-primary">03</p><h2 className="mt-1 text-xl font-semibold">{t("location")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("locationHint")}</p></div><Button type="button" variant="outline" size="sm" onClick={locate}><Crosshair aria-hidden="true" />{t("useMyLocation")}</Button></div>
        <LocationPickerMap latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px_180px]">
          <div className="grid gap-2"><Label htmlFor="address">{t("address")}</Label><div className="relative"><MapPin className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="address" name="address" minLength={2} maxLength={240} required className="ps-10" /></div></div>
          <div className="grid gap-2"><Label>{t("latitude")}</Label><Input value={latitude.toFixed(6)} readOnly dir="ltr" /></div>
          <div className="grid gap-2"><Label>{t("longitude")}</Label><Input value={longitude.toFixed(6)} readOnly dir="ltr" /></div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">04</p><h2 className="mt-1 text-xl font-semibold">{t("contactDetails")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("contactHint")}</p></div>
        <div className="grid gap-4 sm:grid-cols-3"><div className="grid gap-2"><Label htmlFor="contact_name">{t("fullName")}</Label><Input id="contact_name" name="contact_name" defaultValue={initialName} minLength={2} maxLength={160} required /></div><div className="grid gap-2"><Label htmlFor="contact_phone">{t("phone")}</Label><Input id="contact_phone" name="contact_phone" type="tel" defaultValue={initialPhone} minLength={6} maxLength={40} required dir="ltr" /></div><div className="grid gap-2"><Label htmlFor="contact_email">{t("email")}</Label><Input id="contact_email" name="contact_email" type="email" defaultValue={initialEmail} maxLength={320} dir="ltr" /></div></div>
      </section>

      <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border bg-background/92 p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"><p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />{t("approvalNotice")}</p><Button type="submit" size="lg" disabled={busy} className="shrink-0">{busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}{busy ? uploadMessage : t("submitForReview")}</Button></div>
    </form>
  );
}
