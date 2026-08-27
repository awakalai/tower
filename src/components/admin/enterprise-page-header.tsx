import type { LucideIcon } from "lucide-react";

export function EnterprisePageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="flex items-start gap-4">
        <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-primary">{eyebrow}</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.045em]">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}
