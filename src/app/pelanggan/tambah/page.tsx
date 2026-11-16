"use client";

import React from "react";
import { useFreshForm } from "@/lib/use-fresh-form";
import {
  getCustomerInitials,
  detectCityFromAddress,
  saveNewCustomerToStorage,
} from "@/lib/data/mock-customers";
import { Customer, CustomerForm } from "@/types/customer";
import { CustomerFormView } from "@/components/pelanggan/CustomerFormView";

export default function TambahPelangganPage() {
  const { formKey, leaveForm } = useFreshForm();

  const handleConfirmSave = async (form: CustomerForm) => {
    try {
      const res = await fetch("/api/m4/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer mock-admin-token" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.code === "DUPLICATE_EMAIL") {
          return { field: "email" as const, error: "Alamat email sudah terdaftar untuk pelanggan lain." };
        }
        if (json.code === "DUPLICATE_PHONE") {
          return { field: "phone" as const, error: "Nomor telepon/WhatsApp sudah terdaftar untuk pelanggan lain." };
        }
        return { field: "name" as const, error: json.error?.message || "Gagal menyimpan data pelanggan." };
      }

      const newCust: Customer = {
        id: json.data?.id || `CUST-${Date.now()}`,
        name: form.name.trim(),
        initials: getCustomerInitials(form.name, 1),
        avatarBg: "bg-blue-100 text-blue-700",
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: detectCityFromAddress(form.address.trim(), "Bandung"),
        createdAt: new Date().toISOString(),
      };

      saveNewCustomerToStorage(newCust);
      leaveForm("/pelanggan");
    } catch {
      const newCust: Customer = {
        id: `CUST-${Date.now()}`,
        name: form.name.trim(),
        initials: getCustomerInitials(form.name, 1),
        avatarBg: "bg-blue-100 text-blue-700",
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: detectCityFromAddress(form.address.trim(), "Bandung"),
        createdAt: new Date().toISOString(),
      };
      saveNewCustomerToStorage(newCust);
      leaveForm("/pelanggan");
    }
  };

  return <CustomerFormView key={formKey} mode="create" onConfirmSave={handleConfirmSave} />;
}
