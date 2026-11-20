"use client";

import React, { useState, useCallback, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // manualDesktopOpen: null = ikuti default responsive CSS
  // (terbuka di desktop >= 1024px via 'lg:w-60', tertutup di tablet 768px - 1023px via 'w-0')
  // true/false = dipaksa buka/tutup oleh interaksi tombol hamburger pengguna
  const [manualDesktopOpen, setManualDesktopOpen] = useState<boolean | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileSidebarOpen((prev: boolean) => !prev);
    } else {
      setManualDesktopOpen((prev: boolean | null) => {
        const isCurrentOpen =
          prev !== null
            ? prev
            : typeof window !== "undefined" && window.innerWidth >= 1024;
        return !isCurrentOpen;
      });
    }
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Pendekatan CSS responsif untuk menghindari layout flash pada viewport tablet (768px - 1023px):
  // Saat SSR/loading awal, desktop aside tertutup di tablet (<1024px) dan terbuka di desktop (>=1024px)
  const fallbackAsideClass =
    manualDesktopOpen === true
      ? "w-60 border-r border-slate-200/90"
      : manualDesktopOpen === false
      ? "w-0 border-r-0"
      : "w-0 border-r-0 lg:w-60 lg:border-r lg:border-slate-200/90";

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-800 flex flex-col font-sans antialiased print:bg-white print:min-h-0">
      <Navbar
        isSidebarOpen={manualDesktopOpen ?? true}
        onToggleSidebar={toggleSidebar}
      />
      <div className="flex-1 flex relative overflow-x-clip w-full print:block print:w-full print:overflow-visible">
        <Suspense
          fallback={
            <aside
              style={{ height: "calc(100vh - 4rem)" }}
              className={`bg-white shrink-0 hidden md:block print:hidden sticky top-16 self-start transition-[width] duration-300 ease-in-out ${fallbackAsideClass}`}
            />
          }
        >
          <Sidebar
            manualDesktopOpen={manualDesktopOpen}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={closeMobileSidebar}
          />
        </Suspense>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out print:p-0 print:m-0 print:max-w-none print:w-full print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
