import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteAccessGuard } from "@/components/layout/RouteAccessGuard";

export default function InvoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayout>
      <RouteAccessGuard>{children}</RouteAccessGuard>
    </AppLayout>
  );
}

