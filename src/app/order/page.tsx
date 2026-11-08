import React from "react";
import { Truck } from "lucide-react";
import { UnderConstructionView } from "@/components/common/UnderConstructionView";

export default function OrderPage() {
  return (
    <UnderConstructionView
      moduleName="Order"
      icon={Truck}
      description="Halaman pengelolaan pesanan dan pengiriman surat jalan sedang dalam proses pengerjaan."
    />
  );
}
