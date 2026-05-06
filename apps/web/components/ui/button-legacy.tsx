import Link from "next/link";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "secondary" }>;

export function LegacyButton({ tone = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`button ${tone === "secondary" ? "button--secondary" : ""} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function LegacyButtonLink({ href, children }: PropsWithChildren<{ href: string }>) {
  return (
    <Link className="button-link" href={href}>
      {children}
    </Link>
  );
}