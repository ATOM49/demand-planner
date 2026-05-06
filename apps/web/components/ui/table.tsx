import type { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

type TableElement = "table" | "thead" | "tbody" | "tr" | "th" | "td" | "caption";
type TableElementProps<T extends TableElement> = ComponentPropsWithoutRef<T>;

export function TableShell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("overflow-hidden rounded-4xl border border-border/80 bg-card/90 shadow-sm", className)}>{children}</div>;
}

export function TableCellStack({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return (
    <div className="space-y-1">
      <div>{primary}</div>
      {secondary ? <div className="text-sm text-muted-foreground">{secondary}</div> : null}
    </div>
  );
}

export function Table({ children, className, ...props }: PropsWithChildren<TableElementProps<"table">>) {
  return (
    <table className={cn("w-full border-collapse", className)} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className, ...props }: PropsWithChildren<TableElementProps<"thead">>) {
  return (
    <thead className={cn("bg-muted/50", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: PropsWithChildren<TableElementProps<"tbody">>) {
  return (
    <tbody className={cn("[&_tr:last-child_td]:border-b-0", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, ...props }: PropsWithChildren<TableElementProps<"tr">>) {
  return (
    <tr className={cn("border-b border-border/70 transition-colors hover:bg-muted/20", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className, ...props }: PropsWithChildren<TableElementProps<"th">>) {
  return (
    <th className={cn("px-4 py-3 text-left text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase", className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }: PropsWithChildren<TableElementProps<"td">>) {
  return (
    <td className={cn("px-4 py-4 align-top text-sm", className)} {...props}>
      {children}
    </td>
  );
}

export function TableCaption({ children, className, ...props }: PropsWithChildren<TableElementProps<"caption">>) {
  return (
    <caption className={cn("caption-top px-4 py-3 text-left text-sm text-muted-foreground", className)} {...props}>
      {children}
    </caption>
  );
}
