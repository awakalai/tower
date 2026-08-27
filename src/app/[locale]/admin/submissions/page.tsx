import { CheckCircle2, Clock3, Eye, Inbox, Mail, MapPin, Phone, ShieldCheck, XCircle } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { EnterprisePageHeader } from "@/components/admin/enterprise-page-header";
import { SubmissionReviewControls } from "@/components/admin/submission-review-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatNumber, toIntlLocale } from "@/lib/utils";

const statuses = ["all", "submitted", "under_review", "approved", "rejected"] as const;
const statusIcon = { submitted: Clock3, under_review: Eye, approved: CheckCircle2, rejected: XCircle } as const;
const statusVariant = { submitted: "warning", under_review: "secondary", approved: "success", rejected: "destructive" } as const;

export default async function PropertySubmissionsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/submissions">) {
  const [{ locale }, query, t, propertyT, supabase] = await Promise.all([
    params,
    searchParams,
    params.then(({ locale }) => getTranslations({ locale, namespace: "SubmissionsAdmin" })),
    params.then(({ locale }) => getTranslations({ locale, namespace: "Property" })),
    createClient(),
  ]);
  const requested = typeof query.status === "string" && statuses.includes(query.status as typeof statuses[number]) ? query.status as typeof statuses[number] : "all";
  let request = supabase!.from("property_submissions").select("*").order("submitted_at", { ascending: false });
  if (requested !== "all") request = request.eq("status", requested);
  const { data } = await request;
  const submissions = data ?? [];
  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium", timeStyle: "short" });

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} icon={ShieldCheck} />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{statuses.map((status) => <Button asChild key={status} variant={requested === status ? "default" : "outline"} size="sm"><Link href={status === "all" ? "/admin/submissions" : `/admin/submissions?status=${status}`}>{t(status)}</Link></Button>)}</div>

      {submissions.length ? <section className="grid gap-5 xl:grid-cols-2">{submissions.map((submission) => {
        const StatusIcon = statusIcon[submission.status];
        return <Card key={submission.id} className="overflow-hidden"><CardContent className="p-0"><div className="relative aspect-[16/7] min-h-52 bg-muted"><Image src={submission.image_urls[0]} alt={submission.title} fill sizes="(max-width: 1280px) 100vw, 50vw" className="object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16 text-white"><div className="flex flex-wrap items-end justify-between gap-3"><div><Badge className="mb-2 border-white/20 bg-black/35 text-white backdrop-blur">{propertyT(submission.property_type)}</Badge><h2 className="text-xl font-bold">{submission.title}</h2></div><Badge variant={statusVariant[submission.status]}><StatusIcon className="size-3.5" aria-hidden="true" />{t(submission.status)}</Badge></div></div></div>
          <div className="grid gap-5 p-5"><div className="grid gap-3 text-sm sm:grid-cols-2"><p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{submission.address}</span></p><p className="font-semibold">{formatCurrency(Number(submission.price), submission.currency, locale)} · {formatNumber(Number(submission.area_m2), locale)} m²</p><p className="flex items-center gap-2"><Phone className="size-4 text-primary" aria-hidden="true" /><a href={`tel:${submission.contact_phone}`} dir="ltr">{submission.contact_phone}</a></p><p className="flex items-center gap-2"><Mail className="size-4 text-primary" aria-hidden="true" /><a href={`mailto:${submission.contact_email}`} className="truncate">{submission.contact_email || "—"}</a></p></div>
          <div className="rounded-xl bg-muted/45 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{submission.contact_name}</p><p className="text-xs text-muted-foreground">{formatter.format(new Date(submission.submitted_at))}</p></div>{submission.description && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{submission.description}</p>}{submission.features.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{submission.features.map((feature) => <Badge key={feature} variant="outline">{feature}</Badge>)}</div>}</div>
          {submission.image_urls.length > 1 && <div><p className="mb-2 text-xs font-semibold text-muted-foreground">{t("photos", { count: submission.image_urls.length })}</p><div className="flex gap-2 overflow-x-auto">{submission.image_urls.slice(1).map((url, index) => <div key={url} className="relative size-20 shrink-0 overflow-hidden rounded-lg border"><Image src={url} alt={`${submission.title} ${index + 2}`} fill sizes="80px" className="object-cover" /></div>)}</div></div>}
          {(submission.status === "submitted" || submission.status === "under_review") ? <SubmissionReviewControls id={submission.id} locale={locale} /> : <div className="rounded-xl border p-4 text-sm"><p className="font-semibold">{t("completedReview")}</p><p className="mt-1 text-muted-foreground">{submission.reviewer_notes || t("noReviewNote")}</p>{submission.approved_property_id && <Button asChild variant="outline" size="sm" className="mt-3"><Link href={`/properties/${submission.approved_property_id}`}><Eye aria-hidden="true" />{t("viewPublished")}</Link></Button>}</div>}
          </div></CardContent></Card>;
      })}</section> : <Card><CardContent className="grid place-items-center p-16 text-center"><Inbox className="size-10 text-muted-foreground" aria-hidden="true" /><h2 className="mt-4 font-semibold">{t("empty")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("emptyHint")}</p></CardContent></Card>}
    </main>
  );
}
