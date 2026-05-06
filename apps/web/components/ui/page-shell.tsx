import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardTitle } from "./card";

export function PageShell({
  title,
  eyebrow,
  actions,
  children,
}: PropsWithChildren<{ title: string; eyebrow?: string; actions?: ReactNode }>) {
  return (
    <main className="mx-auto flex w-[min(1180px,calc(100%_-_2rem))] flex-col gap-6 py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          {eyebrow ? <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">{eyebrow}</p> : null}
          <h1 className="text-balance text-[clamp(2.2rem,3vw,4rem)] leading-[0.95] font-medium text-foreground">{title}</h1>
        </div>
        {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}

export function SectionCard({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <Card className="gap-4 border border-border/80 bg-card/90 text-card-foreground backdrop-blur-md">
      <header className="border-b border-border/70 px-6 pb-4 group-data-[size=sm]/card:px-4">
        <CardTitle>{title}</CardTitle>
      </header>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function MetricCard({ label, value, helper }: { label: string; value: ReactNode; helper?: string }) {
  return (
    <Card size="sm" className="gap-2 border border-border/80 bg-card/90 text-card-foreground backdrop-blur-md">
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-medium text-foreground">{value}</p>
        {helper ? <p className="text-sm text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "gap-2 border border-dashed border-border bg-background/70 text-sm text-muted-foreground shadow-sm",
        className,
      )}
    >
      <CardContent className="space-y-2">
        <CardTitle className="text-base text-foreground">{title}</CardTitle>
        <p className="leading-6">{description}</p>
      </CardContent>
    </Card>
  );
}