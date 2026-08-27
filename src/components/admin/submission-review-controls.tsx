"use client";

import { CheckCircle2, Eye, LoaderCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { reviewSubmissionAction, type SubmissionReviewState } from "@/app/[locale]/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: SubmissionReviewState = { status: "idle" };

export function SubmissionReviewControls({ id, locale }: { id: string; locale: string }) {
  const t = useTranslations("SubmissionsAdmin");
  const [state, action, pending] = useActionState(reviewSubmissionAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(t("decisionSaved"));
      formRef.current?.reset();
    } else if (state.status === "error") {
      toast.error(t("decisionError"), { description: state.message });
    }
  }, [state, t]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 rounded-xl border bg-muted/20 p-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-2"><Label htmlFor={`review-note-${id}`}>{t("reviewNote")}</Label><Textarea id={`review-note-${id}`} name="reviewer_notes" rows={3} maxLength={4000} placeholder={t("reviewNoteHint")} /></div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button type="submit" name="decision" value="under_review" variant="outline" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Eye aria-hidden="true" />}{t("markReviewing")}</Button>
        <Button type="submit" name="decision" value="rejected" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <XCircle aria-hidden="true" />}{t("reject")}</Button>
        <Button type="submit" name="decision" value="approved" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}{t("approvePublish")}</Button>
      </div>
    </form>
  );
}
