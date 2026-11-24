"use client";

import React from "react";
import { useFreshForm } from "@/lib/use-fresh-form";
import {
  getCustomerInitials,
  detectCityFromAddress,
  saveNewCustomerToStorage,
} from "@/lib/data/mock-customers";
import { Customer, CustomerForm, CustomerSource } from "@/types/customer";
import { CustomerFormView } from "@/components/pelanggan/CustomerFormView";
import { useDevRole } from "@/lib/auth/dev-role";
import { parseCustomerApiError } from "@/lib/customer-api-error";

export default function TambahPelangganPage() {
  const { formKey, leaveForm } = useFreshForm();
  const { activeRole } = useDevRole();
  const customerSource: CustomerSource = activeRole === "ADMIN" ? "Input admin" : "Input partner";

  const handleConfirmSave = async (form: CustomerForm) => {
    const cleanEmail = form.email.trim().toLowerCase();
    try {
      const res = await fetch("/api/m4/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer mock-admin-token" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: cleanEmail,
          phone: form.phone.trim(),
          address: form.address.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return parseCustomerApiError(res.status, json, "Gagal menyimpan data pelanggan.");
      }

      const newCust: Customer = {
        id: json.data?.id || `CUST-${Date.now()}`,
        name: form.name.trim(),
        initials: getCustomerInitials(form.name, 2),
        avatarBg: "bg-blue-100 text-blue-700",
        phone: form.phone.trim(),
        email: cleanEmail,
        address: form.address.trim(),
        city: detectCityFromAddress(form.address.trim(), "Bandung"),
        source: customerSource,
        isNew: true,
        createdAt: new Date().toISOString(),
      };

      saveNewCustomerToStorage(newCust, true);
      leaveForm("/pelanggan");
    } catch {
      return {
        field: "name" as const,
        error: "Gagal terhubung ke server. Periksa koneksi Anda lalu coba simpan lagi.",
      };
    }
  };

  return <CustomerFormView key={`${formKey}-${activeRole}`} mode="create" onConfirmSave={handleConfirmSave} />;
}
