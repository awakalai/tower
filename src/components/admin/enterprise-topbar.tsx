import { Building2, ChevronDown, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { EnterpriseContext } from "@/lib/data/enterprise";

const roleLabels: Record<EnterpriseContext["membership"]["role"], string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  sales_agent: "Sales",
  accountant: "Finance",
  project_manager: "Project manager",
  viewer: "Viewer",
};

export function EnterpriseTopbar({ context }: { context: EnterpriseContext | null }) {
  if (!context) return null;

  return (
    <div className="sticky top-16 z-30 border-b bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{context.organization.name}</p>
              <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {context.branch?.name ?? "All branches"} · {context.organization.default_currency}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-card/70">
          <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
          {roleLabels[context.membership.role]}
        </Badge>
      </div>
    </div>
  );
}
