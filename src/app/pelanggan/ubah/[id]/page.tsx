"use client";

import React, { useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import {
  findCustomerById,
  getCustomerInitials,
  detectCityFromAddress,
  saveUpdatedCustomerToStorage,
} from "@/lib/data/mock-customers";
import { Customer, CustomerForm } from "@/types/customer";
import { CustomerFormView } from "@/components/pelanggan/CustomerFormView";

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function UbahPelangganContent() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const routeParams = useParams<{ id: string }>();
  const customerId = routeParams?.id ? decodeURIComponent(routeParams.id) : "";

  if (!isMounted) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">
          Memuat data pelanggan...
        </p>
      </div>
    );
  }

  const customer = findCustomerById(customerId);

  if (!customer) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">
            Pelanggan Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data pelanggan dengan ID tersebut tidak ditemukan di daftar.
          </p>
        </div>
        <Link
          href="/pelanggan"
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
        >
          Kembali ke daftar pelanggan
        </Link>
      </div>
    );
  }

  const cleanPhone = customer.phone.trim();

  const handleConfirmSave = (form: CustomerForm) => {
    const updatedCustomer: Customer = {
      id: customer.id,
      name: form.name.trim(),
      initials: getCustomerInitials(form.name, 2),
      avatarBg: customer.avatarBg || "bg-blue-100 text-blue-700",
      phone: form.phone.trim() || "0812 3456 7890",
      email: form.email.trim() || "-",
      address: form.address.trim(),
      city: detectCityFromAddress(form.address.trim(), customer.city || "Bandung"),
      createdAt: customer.createdAt || new Date().toISOString(),
    };

    saveUpdatedCustomerToStorage(updatedCustomer);
    router.push("/pelanggan");
  };

  return (
    <CustomerFormView
      key={customer.id}
      mode="edit"
      customerId={customer.id}
      fallbackName={customer.name}
      initialValues={{
        name: customer.name,
        phone: cleanPhone,
        email: customer.email === "-" ? "" : customer.email,
        address: customer.address,
      }}
      onConfirmSave={handleConfirmSave}
    />
  );
}

export default function UbahPelangganPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs text-slate-400 flex items-center justify-center">
          Memuat data pelanggan...
        </div>
      }
    >
      <UbahPelangganContent />
    </Suspense>
  );
}
