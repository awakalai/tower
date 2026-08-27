import { CheckCircle2, Clock3, Eye, HousePlus, MapPin, PlusCircle, ShieldCheck, XCircle } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatNumber } from "@/lib/utils";

const statusIcon = {
  submitted: Clock3,
  under_review: Eye,
  approved: CheckCircle2,
  rejected: XCircle,
} as const;

const statusVariant = {
  submitted: "warning",
  under_review: "secondary",
  approved: "success",
  rejected: "destructive",
} as const;

export default async function SellerPage({
  params,
  searchParams,
}: PageProps<"/[locale]/seller">) {
  const [{ locale }, query, t, propertyT, supabase] = await Promise.all([
    params,
    searchParams,
    params.then(({ locale }) => getTranslations({ locale, namespace: "Seller" })),
    params.then(({ locale }) => getTranslations({ locale, namespace: "Property" })),
    createClient(),
  ]);
  const result = supabase
    ? await supabase.from("property_submissions").select("*").order("created_at", { ascending: false })
    : { data: [], error: null };
  const submissions = result.data ?? [];
  const counts = {
    active: submissions.filter((item) => item.status === "submitted" || item.status === "under_review").length,
    approved: submissions.filter((item) => item.status === "approved").length,
    rejected: submissions.filter((item) => item.status === "rejected").length,
  };

  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {query.submitted === "1" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/20 bg-success/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div><p className="font-semibold">{t("submittedSuccess")}</p><p className="mt-1 text-muted-foreground">{t("submittedSuccessHint")}</p></div>
        </div>
      )}

      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-primary">{t("eyebrow")}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{t("title")}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p></div>
        <Button asChild size="lg"><Link href="/seller/new"><PlusCircle aria-hidden="true" />{t("newProperty")}</Link></Button>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        {([
          ["active", counts.active, Clock3],
          ["approvedCount", counts.approved, CheckCircle2],
          ["rejectedCount", counts.rejected, XCircle],
        ] as const).map(([key, value, Icon]) => (
          <Card key={key}><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold text-muted-foreground">{t(key)}</p><p className="mt-2 text-3xl font-bold">{value}</p></div><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon aria-hidden="true" /></span></CardContent></Card>
        ))}
      </section>

      <div className="mt-8 flex items-center gap-2"><ShieldCheck className="size-5 text-primary" aria-hidden="true" /><h2 className="text-lg font-semibold">{t("yourSubmissions")}</h2></div>
      {submissions.length ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          {submissions.map((submission) => {
            const StatusIcon = statusIcon[submission.status];
            return (
              <Card key={submission.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid sm:grid-cols-[180px_1fr]">
                    <div className="relative min-h-44 bg-muted">
                      <Image src={submission.image_urls[0]} alt={submission.title} fill sizes="(max-width: 640px) 100vw, 180px" className="object-cover" />
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3"><div><Badge variant="outline">{propertyT(submission.property_type)}</Badge><h3 className="mt-2 text-lg font-semibold">{submission.title}</h3></div><Badge variant={statusVariant[submission.status]}><StatusIcon className="size-3.5" aria-hidden="true" />{t(submission.status)}</Badge></div>
                      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4 shrink-0" aria-hidden="true" />{submission.address}</p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm"><span className="font-semibold">{formatCurrency(Number(submission.price), submission.currency, locale)}</span><span>{formatNumber(Number(submission.area_m2), locale)} m²</span></div>
                      {submission.reviewer_notes && <p className="mt-4 rounded-lg bg-muted p-3 text-xs"><span className="font-semibold">{t("reviewNote")}:</span> {submission.reviewer_notes}</p>}
                      {submission.status === "approved" && submission.approved_property_id && <Button asChild variant="outline" size="sm" className="mt-4"><Link href={`/properties/${submission.approved_property_id}`}><Eye aria-hidden="true" />{t("viewPublished")}</Link></Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className="mt-4"><CardContent className="grid place-items-center p-12 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><HousePlus className="size-7" aria-hidden="true" /></span><h3 className="mt-4 font-semibold">{t("empty")}</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">{t("emptyHint")}</p><Button asChild className="mt-5"><Link href="/seller/new"><PlusCircle aria-hidden="true" />{t("newProperty")}</Link></Button></CardContent></Card>
      )}
    </main>
  );
}
