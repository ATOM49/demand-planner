import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

import "./globals.css";
import { Raleway, Manrope } from "next/font/google";
import { cn } from "@/lib/utils";

const manropeHeading = Manrope({ subsets: ["latin"], variable: "--font-heading" });

const raleway = Raleway({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Demand Planner MVP",
  description: "Local-first demand planning dashboard with CSV imports and alerting.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className={cn("font-sans", raleway.variable, manropeHeading.variable)}>
      <body>{children}</body>
    </html>
  );
}
