import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function OrderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppLayout>{children}</AppLayout>;
}

