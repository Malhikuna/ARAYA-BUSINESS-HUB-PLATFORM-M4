"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Cache Components menyimpan state halaman yang ditinggalkan, sehingga form "Tambah"
 * masih berisi isian lama saat dibuka lagi. Pasang `formKey` pada form, lalu keluar
 * lewat `leaveForm` (simpan berhasil atau batal) agar form berikutnya selalu kosong.
 */
export function useFreshForm() {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);

  const leaveForm = (href: string) => {
    router.push(href);
    setFormKey((key) => key + 1);
  };

  return { formKey, leaveForm };
}

