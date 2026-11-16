import React from "react";
import { Receipt } from "lucide-react";
import { UnderConstructionView } from "@/components/common/UnderConstructionView";

export default function InvoicePage() {
  return (
    <UnderConstructionView
      moduleName="Invoice"
      icon={Receipt}
      description="Halaman penerbitan dan manajemen invoice tagihan sedang dalam proses pengerjaan."
    />
  );
}
