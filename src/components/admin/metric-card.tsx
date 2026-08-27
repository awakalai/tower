import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "brand" | "success" | "warning";
}) {
  const tones = {
    default: "bg-muted text-foreground",
    brand: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div>
      <Card className="h-full">
        <CardContent className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
          </div>
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
