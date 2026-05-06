"use client";

import type { SyntheticEvent } from "react";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

import { Button } from "../ui/button";

export function DashboardSkuSearch({
  skus,
  compact = false,
  buttonLabel = "Open",
  className,
}: {
  skus: string[];
  compact?: boolean;
  buttonLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const datalistId = useId();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = value.trim();
    if (!query) {
      setMessage("Enter a SKU to open the workbench.");
      return;
    }

    const matchedSku = skus.find((sku) => sku.toLowerCase() === query.toLowerCase());
    if (!matchedSku) {
      setMessage("Choose a SKU from the list or enter an exact SKU code.");
      return;
    }

    setMessage(null);
    router.push(`/sku/${encodeURIComponent(matchedSku)}`);
  }

  return (
    <div
      className={cn(
        compact
          ? "rounded-4xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-md"
          : "rounded-4xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-md md:min-w-[24rem]",
        className,
      )}
    >
      <form
        className={cn("flex flex-col gap-3 sm:flex-row", compact && "lg:items-end")}
        onSubmit={handleSubmit}
      >
        <input
          className="h-10 flex-1 rounded-3xl border border-input bg-background px-4 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          id="dashboard-sku-search"
          list={datalistId}
          name="sku"
          onChange={(event) => {
            setValue(event.target.value);
          }}
          placeholder="Search SKU"
          value={value}
        />
        <datalist id={datalistId}>
          {skus.map((sku) => (
            <option key={sku} value={sku} />
          ))}
        </datalist>
        <Button className="sm:self-end" type="submit">
          {buttonLabel}
        </Button>
      </form>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
