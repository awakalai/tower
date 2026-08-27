"use client";

import { Building2, CalendarDays, CircleDollarSign, Hash, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { forwardRef } from "react";

import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { ReceiptRow } from "@/types/database";

type ReceiptTemplateProps = {
  locale: string;
  propertyName?: string;
  receipt: ReceiptRow;
};

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  function ReceiptTemplate({ locale, propertyName, receipt }, ref) {
    const t = useTranslations("Receipts");
    const propertyT = useTranslations("Property");
    const dateLocale = locale === "ku" ? "ckb" : locale;
    const date = new Intl.DateTimeFormat(dateLocale, {
      dateStyle: "long",
    }).format(new Date(`${receipt.payment_date}T12:00:00Z`));

    return (
      <div
        ref={ref}
        className="receipt-paper mx-auto min-h-[270mm] w-full max-w-[210mm] overflow-hidden rounded-2xl border shadow-[0_28px_90px_-42px_rgba(0,0,0,.55)]"
      >
        <div className="h-2 bg-primary" />
        <div className="p-6 sm:p-10">
          <header className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#CC0202] text-white">
                <Building2 className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#CC0202]">TOWER</p>
                <p className="text-lg font-bold tracking-tight">Real Estate &amp; Construction</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">Erbil, Kurdistan Region</p>
              </div>
            </div>
            <div className="text-end">
              <h1 className="text-xl font-black uppercase tracking-tight text-[#CC0202]">{t("receipt")}</h1>
              <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">{receipt.receipt_number}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{date}</p>
            </div>
          </header>

          <div className="my-8 grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">{t("receivedFrom")}</p>
              <p className="mt-2 text-lg font-bold">{receipt.customer_name}</p>
              {receipt.customer_phone ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
                  <Phone className="size-3.5" aria-hidden="true" /> {receipt.customer_phone}
                </p>
              ) : null}
              {receipt.customer_address ? (
                <p className="mt-1.5 flex items-center gap-2 text-xs text-zinc-600">
                  <MapPin className="size-3.5" aria-hidden="true" /> {receipt.customer_address}
                </p>
              ) : null}
            </div>
            <div className="sm:text-end">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">{t("amountInWords")}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#CC0202]">
                {formatCurrency(Number(receipt.amount), receipt.currency, locale)}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-[#CC0202]/10 px-3 py-1 text-[11px] font-bold text-[#9f0101]">
                {propertyT(receipt.payment_type)}
              </span>
            </div>
          </div>

          <section>
            <h2 className="text-xs font-black uppercase tracking-[.18em] text-zinc-500">{t("for")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ReceiptLine icon={Hash} label={t("number")} value={receipt.receipt_number} />
              <ReceiptLine icon={CalendarDays} label={t("issued")} value={date} />
              <ReceiptLine icon={Building2} label={t("property")} value={propertyName ?? t("noProperty")} />
              <ReceiptLine icon={CircleDollarSign} label={t("balance")} value={formatCurrency(Number(receipt.balance_due), receipt.currency, locale)} />
              {receipt.contract_total ? (
                <ReceiptLine icon={CircleDollarSign} label={t("contractTotal")} value={formatCurrency(Number(receipt.contract_total), receipt.currency, locale)} />
              ) : null}
              {receipt.installment_number ? (
                <ReceiptLine icon={Hash} label={t("installmentNumber")} value={String(receipt.installment_number)} />
              ) : null}
              {receipt.next_due_date ? (
                <ReceiptLine
                  icon={CalendarDays}
                  label={t("dueDate")}
                  value={new Intl.DateTimeFormat(dateLocale, { dateStyle: "long" }).format(new Date(`${receipt.next_due_date}T12:00:00Z`))}
                />
              ) : null}
            </div>
          </section>

          {receipt.notes ? (
            <div className="receipt-notes mt-7 rounded-xl border-s-4 border-[#CC0202] bg-zinc-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-zinc-500">{t("notes")}</p>
              <p className="mt-1.5 text-xs leading-6 text-zinc-700">{receipt.notes}</p>
            </div>
          ) : null}

          <div className="receipt-signatures mt-16 grid grid-cols-2 gap-10 text-center">
            <div>
              <Separator className="bg-zinc-400" />
              <p className="mt-2 text-[11px] font-semibold text-zinc-600">{receipt.customer_name}</p>
            </div>
            <div>
              <Separator className="bg-zinc-400" />
              <p className="mt-2 text-[11px] font-semibold text-zinc-600">{t("signature")}</p>
              <p className="mt-1 text-[10px] text-zinc-500">{receipt.authorized_by}</p>
            </div>
          </div>

          <footer className="receipt-footer mt-14 border-t border-zinc-200 pt-5 text-center">
            <p className="text-xs font-semibold text-[#CC0202]">{t("thankYou")}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[.18em] text-zinc-400">Tower Property Management System</p>
          </footer>
        </div>
      </div>
    );
  },
);

function ReceiptLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#CC0202]/10 text-[#CC0202]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-zinc-500">{label}</p>
        <p className="mt-1 break-words text-xs font-semibold">{value}</p>
      </div>
    </div>
  );
}
