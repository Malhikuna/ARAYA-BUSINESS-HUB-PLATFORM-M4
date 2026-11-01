"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  getCustomerInitials,
  detectCityFromAddress,
  saveNewCustomerToStorage,
} from "@/lib/data/mock-customers";
import { Customer, CustomerForm } from "@/types/customer";
import { CustomerFormView } from "@/components/pelanggan/CustomerFormView";

export default function TambahPelangganPage() {
  const router = useRouter();

  const handleConfirmSave = (form: CustomerForm) => {
    const newCust: Customer = {
      id: `CUST-${Date.now()}`,
      name: form.name.trim(),
      initials: getCustomerInitials(form.name, 1),
      avatarBg: "bg-blue-100 text-blue-700",
      phone: form.phone.trim() ? `+62 ${form.phone.trim()}` : "0812 3456 7890",
      email: form.email.trim() || "-",
      address: form.address.trim(),
      city: detectCityFromAddress(form.address.trim(), "Bandung"),
      createdAt: new Date().toISOString(),
    };

    saveNewCustomerToStorage(newCust);
    router.push("/pelanggan");
  };

  return <CustomerFormView mode="create" onConfirmSave={handleConfirmSave} />;
}
