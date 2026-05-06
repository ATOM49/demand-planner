import type { PropsWithChildren } from "react";

import { AppHeader } from "@/components/ui/app-header";

import { getDashboardHeaderData } from "../../lib/server/dashboard";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const { skus } = await getDashboardHeaderData();

  return (
    <>
      <AppHeader skus={skus} />
      {children}
    </>
  );
}