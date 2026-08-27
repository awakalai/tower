import { Save } from "lucide-react";

import { updateOperationalStatusAction } from "@/app/[locale]/admin/actions";
import { Button } from "@/components/ui/button";

export function OperationalStatusForm({
  locale,
  table,
  id,
  value,
  options,
  labels,
  saveLabel,
}: {
  locale: string;
  table: "leads" | "deals" | "projects" | "installments" | "tasks" | "inquiries";
  id: string;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
  saveLabel: string;
}) {
  return (
    <form action={updateOperationalStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={value}
        aria-label="Status"
        className="h-9 min-w-32 rounded-md border bg-background/70 px-2 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map((option) => <option value={option} key={option}>{labels[option] ?? option}</option>)}
      </select>
      <Button type="submit" size="icon" variant="outline" className="size-9" aria-label={saveLabel} title={saveLabel}>
        <Save className="size-3.5" aria-hidden="true" />
      </Button>
    </form>
  );
}
