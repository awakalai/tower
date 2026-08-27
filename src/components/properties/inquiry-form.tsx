"use client";

import { CheckCircle2, LoaderCircle, MessageSquareText, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

export function InquiryForm({ propertyId, organizationId, locale }: { propertyId: string; organizationId: string; locale: string }) {
  const t = useTranslations("Property");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    if (name.length < 2 || phone.length < 5) return toast.error(t("inquiryError"));
    const supabase = createClient();
    if (!supabase) return toast.error(t("inquiryError"));
    setSending(true);
    const { error } = await supabase.from("inquiries").insert({
      property_id: propertyId,
      organization_id: organizationId,
      name,
      phone,
      email: String(form.get("email") ?? "").trim(),
      message: String(form.get("message") ?? "").trim(),
      locale,
    });
    setSending(false);
    if (error) return toast.error(t("inquiryError"), { description: error.message });
    setSent(true);
    toast.success(t("inquirySent"));
  }

  if (sent) return <div className="rounded-xl border border-success/20 bg-success/10 p-4 text-center"><CheckCircle2 className="mx-auto size-6 text-success" /><p className="mt-2 text-sm font-semibold">{t("inquirySent")}</p><p className="mt-1 text-xs text-muted-foreground">{t("inquirySentHint")}</p></div>;
  if (!open) return <Button size="lg" className="mt-1 w-full" onClick={() => setOpen(true)}><MessageSquareText />{t("contact")}</Button>;

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border bg-muted/35 p-4">
      <p className="text-sm font-semibold">{t("inquiryTitle")}</p>
      <div className="grid gap-1.5"><Label htmlFor="inquiry-name">{t("customerName")}</Label><Input id="inquiry-name" name="name" required minLength={2} /></div>
      <div className="grid gap-1.5"><Label htmlFor="inquiry-phone">{t("phone")}</Label><Input id="inquiry-phone" name="phone" type="tel" required minLength={5} /></div>
      <div className="grid gap-1.5"><Label htmlFor="inquiry-email">{t("email")}</Label><Input id="inquiry-email" name="email" type="email" /></div>
      <div className="grid gap-1.5"><Label htmlFor="inquiry-message">{t("message")}</Label><Textarea id="inquiry-message" name="message" rows={3} /></div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={sending}>{sending ? <LoaderCircle className="animate-spin" /> : <Send />}{sending ? t("sending") : t("sendInquiry")}</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
      </div>
    </form>
  );
}
