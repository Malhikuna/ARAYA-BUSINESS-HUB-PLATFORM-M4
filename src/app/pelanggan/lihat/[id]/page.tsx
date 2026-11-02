"use client";

import React, { useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IdCard, Phone, Mail, MapPin, AlertCircle, Pencil } from "lucide-react";
import { findCustomerById } from "@/lib/data/mock-customers";
import { Customer } from "@/types/customer";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { CustomerProfileSidebar } from "@/components/pelanggan/CustomerProfileSidebar";

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function LihatPelangganDetailView({ customer }: { customer: Customer }) {
  const formattedPhone = customer.phone.startsWith("+62")
    ? customer.phone
    : `+62 ${customer.phone.replace(/^0/, "")}`;

  return (
    <>
      <Breadcrumb
        separator="/"
        items={[{ label: "Pelanggan", href: "/pelanggan" }, { label: "Detail" }]}
        className="mb-3"
      />
      <BackLink href="/pelanggan" label="Kembali ke daftar pelanggan" />

      <div className="mb-5">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">
          Detail data pelanggan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Rincian informasi identitas dan kontak pelanggan untuk penawaran serta penagihan transaksi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Read-Only Identity Card (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-100 space-y-5">
          <div className="bg-[#f0f4fa] rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-sm">
              <IdCard className="w-4 h-4 text-[#19376d]" />
              <span>Informasi identitas pelanggan</span>
            </div>
            <span className="text-xs text-slate-500 font-mono font-semibold">
              ID: {customer.id}
            </span>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-800 mb-1.5">Nama pelanggan</span>
            <div className="w-full min-h-11 px-4 py-2.5 rounded-xl bg-[#f8fafc] border border-slate-200/80 text-xs sm:text-sm font-bold text-slate-900 flex items-center">
              {customer.name}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-slate-800 mb-1.5">Nomor telepon</span>
              <div className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 text-xs font-mono text-slate-800 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{formattedPhone}</span>
              </div>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-800 mb-1.5">Kota operasional</span>
              <div className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 text-xs text-slate-800 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{customer.city || "Bandung"}</span>
              </div>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-800 mb-1.5">Email</span>
            <div className="w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 text-xs text-slate-800 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{customer.email && customer.email !== "-" ? customer.email : "Belum diisi"}</span>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-800 mb-1.5">Alamat lengkap</span>
            <div className="w-full min-h-24 p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
              {customer.address}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/pelanggan"
              className="px-5 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors"
            >
              Kembali
            </Link>
            <Link
              href={`/pelanggan/ubah/${customer.id}`}
              className="px-5 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Ubah data</span>
            </Link>
          </div>
        </div>

        <CustomerProfileSidebar
          title="Profil kartu pelanggan"
          statusVariant="active"
          initials={customer.initials}
          displayName={customer.name}
          phoneText={customer.phone}
          emailText={customer.email && customer.email !== "-" ? customer.email : "Belum diisi"}
          addressText={customer.address}
          isItalicPlaceholder={false}
          customerId={customer.id}
        />
      </div>
    </>
  );
}

function LihatPelangganContent() {
  const isMounted = useIsMounted();
  const routeParams = useParams<{ id: string }>();
  const customerId = routeParams?.id ? decodeURIComponent(routeParams.id) : "";

  if (!isMounted) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Memuat detail pelanggan...</p>
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
          <h2 className="text-base font-heading font-bold text-slate-900">Pelanggan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Data pelanggan dengan ID tersebut tidak ditemukan atau telah dihapus.
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

  return <LihatPelangganDetailView customer={customer} />;
}

export default function LihatPelangganPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500 flex items-center justify-center">Memuat detail pelanggan...</div>}>
      <LihatPelangganContent />
    </Suspense>
  );
}
