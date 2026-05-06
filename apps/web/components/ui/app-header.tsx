import Link from "next/link";

import { DashboardSkuSearch } from "../dashboard/sku-search";

export function AppHeader({ skus }: { skus: string[] }) {
  return (
    <header className="border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-[min(1180px,calc(100%_-_2rem))] flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Local-first MVP
          </p>
          <Link
            className="inline-flex items-center text-2xl font-medium tracking-[-0.03em] text-foreground transition hover:text-primary"
            href="/"
          >
            Demand Planner
          </Link>
        </div>
        <DashboardSkuSearch
          buttonLabel="Open SKU"
          className="w-full max-w-xl"
          compact
          skus={skus}
        />
      </div>
    </header>
  );
}
