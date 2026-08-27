import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="grid min-h-[calc(100svh-4rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[360px_1fr]">
      <Skeleton className="h-52 lg:h-full" />
      <Skeleton className="min-h-[520px]" />
    </main>
  );
}
