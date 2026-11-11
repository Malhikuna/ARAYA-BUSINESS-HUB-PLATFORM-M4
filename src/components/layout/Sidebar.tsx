"use client";

import React from "react";
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
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpen = true, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { isDev, activeRole, profile } = useDevRole();

  const filteredMenuItems = menuItems.filter((item) => {
    if (isDev && activeRole === "ADMIN") {
      // Admin hanya melihat halaman Katalog dan Pelanggan
      return item.href === "/produk" || item.href === "/pelanggan";
    }
    // Role Produk dan Jasa dapat melihat semua halaman
    return true;
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

  return (
    <>
      {/* Desktop Collapsible Sticky Sidebar */}
      <aside
        aria-hidden={!isOpen}
        style={{ height: "calc(100vh - 4rem)" }}
        className={`bg-white shrink-0 hidden md:block print:hidden sticky top-16 self-start overflow-y-auto custom-scrollbar transition-[width,border-color] duration-300 ease-in-out ${
          isOpen
            ? "w-60 border-r border-slate-200/90"
            : "w-0 border-r-0 overflow-hidden"
        }`}
      >
        <div
          className={`w-full p-4 transition-[transform,opacity] duration-300 ease-in-out ${
            isOpen
              ? "translate-x-0 opacity-100"
              : "-translate-x-4 opacity-0 pointer-events-none"
          }`}
        >
          {renderMenuContent(false)}
        </div>
      </aside>

      {/* Mobile Backdrop & Slide-over Sidebar */}
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={`fixed inset-0 top-16 bg-slate-900/20 z-20 md:hidden print:hidden transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        aria-hidden={!isOpen}
        className={`fixed top-16 bottom-0 left-0 z-30 w-60 bg-white border-r border-slate-200/90 p-4 shadow-lg md:hidden print:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderMenuContent(true)}
      </aside>
    </>
  );
}
