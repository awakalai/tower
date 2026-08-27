"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyInviteLink({ token, locale }: { token: string; locale: string }) {
  const t = useTranslations("Enterprise");
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/${locale}/join?token=${token}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <Button type="button" variant="outline" size="sm" onClick={copy}>{copied ? <Check className="text-success" /> : <Copy />}{copied ? t("copied") : t("copyInvite")}</Button>;
}
