"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IdCard, Phone, Mail, AlertCircle } from "lucide-react";
import { getCustomerInitials } from "@/lib/data/mock-customers";
import { CustomerForm, FormErrors } from "@/types/customer";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { BackLink } from "@/components/common/BackLink";
import { FormAlertBanner } from "@/components/common/FormAlertBanner";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { CustomerProfileSidebar } from "@/components/pelanggan/CustomerProfileSidebar";

const MAX_NAME_LENGTH = 100;
const MIN_PHONE_DIGITS = 9;
const MAX_PHONE_DIGITS = 13;
const MAX_EMAIL_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 250;

export interface CustomerFormViewProps {
  mode: "create" | "edit";
  initialValues?: CustomerForm;
  customerId?: string;
  fallbackName?: string;
  onConfirmSave: (form: CustomerForm) => void;
}

export function CustomerFormView({
  mode,
  initialValues = { name: "", phone: "", email: "", address: "" },
  customerId,
  fallbackName,
  onConfirmSave,
}: CustomerFormViewProps) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<CustomerForm>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasSubmittedError, setHasSubmittedError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Isi nama pelanggan, misalnya PT Maju Bersama.";
    if (!form.phone.trim()) {
      errs.phone = "Isi nomor telepon aktif pelanggan.";
    } else if (form.phone.trim().length < MIN_PHONE_DIGITS) {
      errs.phone = `Nomor telepon minimal ${MIN_PHONE_DIGITS} digit setelah +62.`;
    }
    if (!form.address.trim()) errs.address = "Isi alamat lengkap pelanggan.";
    return errs;
  };

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (Object.keys(next).length === 0) setHasSubmittedError(false);
        return next;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name as keyof FormErrors);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanNumber = e.target.value.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);
    setForm((prev) => ({ ...prev, phone: cleanNumber }));
    clearFieldError("phone");
  };

  const handleReset = () => {
    setForm(initialValues);
    setErrors({});
    setHasSubmittedError(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setHasSubmittedError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setHasSubmittedError(false);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    setIsSubmitting(true);
    onConfirmSave(form);
  };

  const initials = getCustomerInitials(isEdit ? form.name || fallbackName || "Pelanggan" : form.name, isEdit ? 2 : 1);
  const formattedPhone = form.phone ? `+62 ${form.phone}` : "Belum diisi";

  return (
    <>
      <Breadcrumb separator="/" items={[{ label: "Pelanggan", href: "/pelanggan" }, { label: isEdit ? "Ubah" : "Tambah" }]} className="mb-3" />
      <BackLink href="/pelanggan" label="Kembali ke daftar pelanggan" />

      <div className="mb-5">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 tracking-tight">
          {isEdit ? "Ubah data pelanggan" : "Tambah pelanggan"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isEdit
            ? "Perbarui informasi data pelanggan untuk keperluan penawaran dan penagihan transaksi."
            : "Masukkan informasi data pelanggan baru untuk keperluan penawaran dan penagihan transaksi."}
        </p>
      </div>

      <FormAlertBanner visible={hasSubmittedError} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-100">
          <div className="bg-[#f0f4fa] rounded-xl px-4 py-3 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-sm">
              <IdCard className="w-4 h-4 text-[#19376d]" />
              <span>Informasi identitas pelanggan</span>
            </div>
            {isEdit ? (
              <span className="text-xs text-slate-500 font-mono font-medium">ID: {customerId}</span>
            ) : (
              <span className="text-xs text-slate-500 font-medium">Modul penjualan</span>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="name" className="block text-xs font-semibold text-slate-800">Nama pelanggan <span className="text-red-500">*</span></label>
                <span className="text-[11px] text-slate-400">{form.name.length > 0 ? `${form.name.length}/${MAX_NAME_LENGTH} karakter` : `Maks. ${MAX_NAME_LENGTH} karakter`}</span>
              </div>
              <div className="relative">
                <input
                  id="name" name="name" type="text" maxLength={MAX_NAME_LENGTH} value={form.name} onChange={handleChange} placeholder="Contoh: PT Maju Bersama"
                  className={`w-full h-11 px-4 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all ${errors.name ? "bg-white border-2 border-red-500 pr-10 ring-2 ring-red-500/10" : "bg-[#f0f4fa] border border-transparent focus:ring-1 focus:ring-[#19376d]"}`}
                />
                {errors.name && <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none"><AlertCircle className="w-4 h-4 text-red-500" /></div>}
              </div>
              {errors.name && <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 mt-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{errors.name}</span></div>}
              <p className="text-[11px] text-slate-400 mt-1">Gunakan nama resmi perusahaan atau perorangan sesuai dokumen identitas perpajakan.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="phone" className="block text-xs font-semibold text-slate-800">Nomor telepon <span className="text-red-500">*</span></label>
                <span className="text-[11px] text-slate-400">{form.phone.length > 0 ? `${form.phone.length}/${MAX_PHONE_DIGITS} digit` : `${MIN_PHONE_DIGITS}–${MAX_PHONE_DIGITS} digit`}</span>
              </div>
              <div className={`flex items-center h-11 px-4 rounded-xl transition-all relative ${errors.phone ? "bg-white border-2 border-red-500 ring-2 ring-red-500/10" : "bg-[#f0f4fa] border border-transparent focus-within:ring-1 focus-within:ring-[#19376d]"}`}>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium pr-3 border-r border-slate-300/80">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /><span>+62</span>
                </div>
                <input
                  id="phone" name="phone" type="tel" inputMode="numeric" maxLength={MAX_PHONE_DIGITS} value={form.phone} onChange={handlePhoneChange} placeholder="812 3456 7890"
                  className="w-full bg-transparent border-0 outline-none pl-3 pr-8 text-xs text-slate-800 placeholder:text-slate-400"
                />
                {errors.phone && <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none"><AlertCircle className="w-4 h-4 text-red-500" /></div>}
              </div>
              {errors.phone && <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 mt-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{errors.phone}</span></div>}
              <p className="text-[11px] text-slate-400 mt-1">Format nomor telepon aktif untuk konfirmasi penawaran dan bukti terima.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-800">Email</label>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f0f4fa] text-slate-400 font-medium">Opsional</span>
              </div>
              <div className="flex items-center h-11 px-4 rounded-xl bg-[#f0f4fa] focus-within:ring-1 focus-within:ring-[#19376d] transition-all">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-3" />
                <input
                  id="email" name="email" type="email" maxLength={MAX_EMAIL_LENGTH} value={form.email} onChange={handleChange} placeholder="nama@perusahaan.co.id"
                  className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Alamat email untuk pengiriman invoice otomatis dan dokumen penawaran digital.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="address" className="block text-xs font-semibold text-slate-800">Alamat <span className="text-red-500">*</span></label>
                <span className="text-[11px] text-slate-400">{form.address.length > 0 ? `${form.address.length}/${MAX_ADDRESS_LENGTH} karakter` : `Maks. ${MAX_ADDRESS_LENGTH} karakter`}</span>
              </div>
              <div className="relative">
                <textarea
                  id="address" name="address" rows={4} maxLength={MAX_ADDRESS_LENGTH} value={form.address} onChange={handleChange} placeholder="Tulis alamat lengkap penagihan atau pengiriman..."
                  className={`w-full p-4 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none resize-none transition-all ${errors.address ? "bg-white border-2 border-red-500 pr-10 ring-2 ring-red-500/10" : "bg-[#f0f4fa] border border-transparent focus:ring-1 focus:ring-[#19376d]"}`}
                />
                {errors.address && <div className="absolute top-3.5 right-3.5 pointer-events-none"><AlertCircle className="w-4 h-4 text-red-500" /></div>}
              </div>
              {errors.address && <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 mt-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{errors.address}</span></div>}
              <p className="text-[11px] text-slate-400 mt-1">Alamat lengkap pengiriman barang atau penagihan faktur penjualan.</p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              {isEdit ? (
                <>
                  <button type="button" onClick={handleReset} className="px-5 h-10 rounded-xl bg-[#f0f4fa] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors">Reset perubahan</button>
                  <Link href="/pelanggan" className="px-5 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors">Batal</Link>
                  <button type="submit" disabled={isSubmitting} className="px-6 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50">
                    {isSubmitting ? "Menyimpan perubahan..." : "Simpan perubahan"}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={handleReset} className="px-6 h-10 rounded-xl bg-[#f0f4fa] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 h-10 rounded-xl bg-[#19376d] hover:bg-[#122852] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50">
                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        <CustomerProfileSidebar
          statusVariant={hasSubmittedError ? "error" : isEdit ? "active" : "draft"}
          initials={initials}
          displayName={form.name.trim() || fallbackName || "Nama pelanggan"}
          phoneText={form.phone ? formattedPhone : "Belum diisi"}
          emailText={form.email.trim() || "Belum diisi"}
          addressText={form.address.trim() || "Belum ada rincian alamat"}
          isItalicPlaceholder
          customerId={isEdit ? customerId : undefined}
        />
      </div>

      <ConfirmationModal
        open={isConfirmOpen}
        title={isEdit ? "Simpan perubahan data pelanggan?" : "Simpan pelanggan baru?"}
        subtitle={isEdit ? "Konfirmasi pembaruan informasi pelanggan" : "Konfirmasi penambahan data pelanggan"}
        description={
          isEdit
            ? "Perubahan nama, kontak, atau alamat pelanggan ini akan langsung diterapkan pada daftar pelanggan serta dokumen penawaran berikutnya."
            : "Pastikan informasi identitas, nomor telepon, dan alamat pelanggan di atas sudah sesuai sebelum disimpan ke daftar pelanggan."
        }
        confirmLabel={isEdit ? "Ya, simpan perubahan" : "Ya, simpan"}
        variant={isEdit ? "primary" : "success"}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#102a54] text-white flex items-center justify-center font-bold text-xs shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">{form.name.trim()}</div>
            <div className="text-[11px] font-mono text-slate-500">
              {isEdit ? `${customerId} | ${formattedPhone}` : `${formattedPhone} | ${form.email.trim() || "Tanpa email"}`}
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600">{form.address.trim()}</div>
      </ConfirmationModal>
    </>
  );
}
