"use client";

import React, { Suspense, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useDevRole } from "@/lib/auth/dev-role";
import { canAccessRoute } from "@/lib/auth/navigation-access";

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function RouteAccessGuardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const isMounted = useIsMounted();
  const { activeRole, tipeUsaha } = useDevRole();

  const decision = canAccessRoute(activeRole, pathname, tipeUsaha);
  const isBlocked = isMounted && !decision.allowed;

  useEffect(() => {
    if (isBlocked) {
      router.replace(decision.redirectTo);
    }
  }, [isBlocked, decision.redirectTo, router]);

  if (isBlocked) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-slate-900">
            {decision.title || "Akses Dibatasi"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {decision.reason || "Anda tidak memiliki izin untuk mengakses halaman ini."}
          </p>
        </div>
        <Link
          href={decision.redirectTo}
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl bg-[#19376d] text-white text-xs font-semibold hover:bg-[#122852] transition-colors"
        >
          {decision.redirectTo === "/penawaran" ? "Kembali ke Penawaran saya" : "Kembali ke Katalog"}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Guard halaman berbasis role & tipe_usaha Partner (M4-US1-AC3 / BR-13).
 * Dibungkus <Suspense> agar kompatibel dengan prerender Next.js 16 Cache Components pada rute dinamis [id].
 */
export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs text-slate-400 text-center">
          Memuat halaman...
        </div>
      }
    >
      <RouteAccessGuardInner>{children}</RouteAccessGuardInner>
    </Suspense>
  );
}
