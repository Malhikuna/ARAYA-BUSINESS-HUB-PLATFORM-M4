import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function PelangganLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppLayout>{children}</AppLayout>;
}

