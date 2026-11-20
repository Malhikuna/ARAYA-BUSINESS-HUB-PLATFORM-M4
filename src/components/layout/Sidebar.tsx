"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Users,
  FileText,
  Receipt,
  Truck,
  Package,
  Wrench,
  X,
} from "lucide-react";
import { useDevRole } from "@/lib/auth/dev-role";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  matchPrefix?: string;
}

const menuItems: MenuItem[] = [
  {
    name: "Katalog",
    href: "/produk",
    icon: BookOpen,
    matchPrefix: "/produk",
  },
  {
    name: "Pelanggan",
    href: "/pelanggan",
    icon: Users,
    matchPrefix: "/pelanggan",
  },
  // Catatan: Rute /permintaan ditunda sementara hingga halaman src/app/permintaan siap
  {
    name: "Penawaran",
    href: "/penawaran",
    icon: FileText,
    matchPrefix: "/penawaran",
  },
  {
    name: "Invoice",
    href: "/invoice",
    icon: Receipt,
    matchPrefix: "/invoice",
  },
  {
    name: "Order",
    href: "/order",
    icon: Truck,
    matchPrefix: "/order",
  },
];

export interface SidebarProps {
  isOpen?: boolean;
  isDesktopOpen?: boolean;
  manualDesktopOpen?: boolean | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  isOpen = true,
  isDesktopOpen,
  manualDesktopOpen,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { isDev, activeRole, profile } = useDevRole();

  const mobileOpen = isMobileOpen !== undefined ? isMobileOpen : false;

  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onCloseMobile?.();
    }
  }, [pathname, onCloseMobile]);

  // Konsistensi filtering menu:
  // Baik dalam mode simulasi maupun non-dev (activeRole = "ADMIN"),
  // hak akses halaman konsisten dengan peran pengguna.
  const filteredMenuItems = menuItems.filter((item) => {
    // Sembunyikan rute /permintaan untuk mencegah risiko error 404
    if (item.href === "/permintaan") return false;

    if (activeRole === "ADMIN") {
      // Super Admin hanya mengelola Master Katalog dan Pelanggan
      return item.href === "/produk" || item.href === "/pelanggan";
    }
    if (activeRole === "PARTNER_PRODUCT") {
      // Mitra Produk: Produk, Pelanggan, Invoice, dan Order (tanpa Penawaran & Permintaan)
      return item.href !== "/penawaran";
    }
    if (activeRole === "PARTNER_SERVICE") {
      // Mitra Jasa: Jasa, Pelanggan, Penawaran, Invoice, dan Order
      return true;
    }
    // Fallback konsisten untuk mode non-dev
    return item.href === "/produk" || item.href === "/pelanggan";
  });

  const resolveMenuIcon = (item: MenuItem) => {
    if (isDev && item.href === "/produk") {
      if (activeRole === "PARTNER_PRODUCT") return Package;
      if (activeRole === "PARTNER_SERVICE") return Wrench;
      return BookOpen;
    }
    return item.icon;
  };

  const renderMenuContent = (isMobileDrawer = false) => (
    <>
      {isMobileDrawer && (
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
          <span className="font-heading font-bold text-sm text-slate-800">Menu Navigasi</span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu sidebar"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="text-xs font-semibold text-slate-600 px-3 py-2 whitespace-nowrap">
        Penawaran &amp; tagihan penjualan
      </div>
      <nav aria-label="Menu modul penjualan" className="space-y-1 mt-1 text-sm">
        {filteredMenuItems.map((item) => {
          const Icon = resolveMenuIcon(item);
          const displayName = isDev && item.href === "/produk" ? profile.catalogMenuName : item.name;
          const isActive = item.matchPrefix
            ? pathname.startsWith(item.matchPrefix)
            : pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={isMobileDrawer ? onCloseMobile : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-[#eef4ff] text-[#19376d] font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-[#19376d]" : "text-slate-500"
                }`}
              />
              <span>{displayName}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  // Evaluasi kelas styling desktop aside secara responsif via CSS
  // untuk menghilangkan layout flash pada tablet (768px - 1023px)
  const isExplicitDesktopOpen =
    manualDesktopOpen !== undefined
      ? manualDesktopOpen
      : isDesktopOpen !== undefined
      ? isDesktopOpen
      : null;

  const desktopAsideClass =
    isExplicitDesktopOpen === true
      ? "w-60 border-r border-slate-200/90"
      : isExplicitDesktopOpen === false
      ? "w-0 border-r-0 overflow-hidden"
      : "w-0 border-r-0 overflow-hidden lg:w-60 lg:border-r lg:border-slate-200/90 lg:overflow-y-auto";

  const desktopInnerClass =
    isExplicitDesktopOpen === true
      ? "translate-x-0 opacity-100"
      : isExplicitDesktopOpen === false
      ? "-translate-x-4 opacity-0 pointer-events-none"
      : "-translate-x-4 opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto";

  return (
    <>
      {/* Desktop Collapsible Sticky Sidebar */}
      <aside
        aria-hidden={isExplicitDesktopOpen === false}
        style={{ height: "calc(100vh - 4rem)" }}
        className={`bg-white shrink-0 hidden md:block print:hidden sticky top-16 self-start overflow-y-auto custom-scrollbar transition-[width,border-color] duration-300 ease-in-out ${desktopAsideClass}`}
      >
        <div className={`w-full p-4 transition-[transform,opacity] duration-300 ease-in-out ${desktopInnerClass}`}>
          {renderMenuContent(false)}
        </div>
      </aside>

      {/* Mobile Backdrop & Slide-over Sidebar */}
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={`fixed inset-0 top-16 bg-slate-900/20 z-20 md:hidden print:hidden transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        aria-hidden={!mobileOpen}
        className={`fixed top-16 bottom-0 left-0 z-30 w-60 bg-white border-r border-slate-200/90 p-4 shadow-lg md:hidden print:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"
        }`}
      >
        {renderMenuContent(true)}
      </aside>
    </>
  );
}
