import type { PropsWithChildren } from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
  {
    variants: {
      tone: {
        high: "border-destructive/20 bg-destructive/10 text-destructive",
        medium: "border-amber-500/20 bg-amber-500/10 text-amber-700",
        low: "border-emerald-600/20 bg-emerald-600/10 text-emerald-700",
        neutral: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export function Badge({ tone = "neutral", children }: PropsWithChildren<{ tone?: "high" | "medium" | "low" | "neutral" }>) {
  return <span className={cn(badgeVariants({ tone }))}>{children}</span>;
}
