import * as React from "react";

import { cn } from "@/lib/utils";

export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn("flex h-10 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25", className)}
      {...props}
    />
  );
}

export function FormGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)} {...props} />;
}

export function FormField({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("grid gap-2 text-xs font-semibold", className)} {...props} />;
}

export function CreatePanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border bg-card shadow-sm open:ring-1 open:ring-primary/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-lg leading-none text-primary-foreground transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="border-t p-5">{children}</div>
    </details>
  );
}
