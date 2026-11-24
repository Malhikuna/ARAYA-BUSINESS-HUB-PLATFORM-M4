"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pelanggan");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <div className="w-4 h-4 rounded-full border-2 border-[#19376d] border-t-transparent animate-spin" />
        <span>Memuat...</span>
      </div>
    </div>
  );
}
