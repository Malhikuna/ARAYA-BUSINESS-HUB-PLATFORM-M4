"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Menu, ChevronDown, Check, ShieldCheck, Package, Wrench } from "lucide-react";
import { GlobalSearchBar } from "@/components/layout/GlobalSearchBar";
import { useDevRole, DevUserRole, DEV_ROLE_PROFILES } from "@/lib/auth/dev-role";

export interface NavbarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Navbar({
  isSidebarOpen = true,
  onToggleSidebar,
}: NavbarProps) {
  const router = useRouter();
  const { isDev, activeRole, profile, switchRole } = useDevRole();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Tutup menu sidebar" : "Buka menu sidebar"}
            aria-expanded={isSidebarOpen}
            title={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-[#19376d] hover:bg-[#eef4ff] active:scale-95 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link
          href="/pelanggan"
          className="font-heading font-bold text-lg text-slate-900 tracking-tight hover:opacity-90 transition-opacity"
        >
          Araya Business Hub
        </Link>
      </div>

      {/* Global Search Bar */}
      <GlobalSearchBar />

      {/* User Account / Profile */}
      {!isDev ? (
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-full bg-[#102a54] text-white flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-slate-800">Rani K.</span>
        </div>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            title="Klik untuk mengganti role testing lokal"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/90 transition-colors cursor-pointer select-none border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-[#102a54] text-white flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {profile.name}
              </span>
              <span className="text-[10px] font-medium text-[#19376d] bg-blue-50 px-1.5 py-0.2 rounded leading-tight w-fit">
                {profile.roleLabel}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Simulasi Role (Testing Lokal)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Uji tampilan halaman dan pembatasan fitur sesuai role:
                </p>
              </div>

              <div className="space-y-1">
                {(Object.keys(DEV_ROLE_PROFILES) as DevUserRole[]).map((roleKey) => {
                  const item = DEV_ROLE_PROFILES[roleKey];
                  const isSelected = activeRole === roleKey;
                  const Icon =
                    roleKey === "ADMIN"
                      ? ShieldCheck
                      : roleKey === "PARTNER_PRODUCT"
                      ? Package
                      : Wrench;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => {
                        switchRole(roleKey);
                        setIsDropdownOpen(false);
                        const currentPath =
                          typeof window !== "undefined"
                            ? window.location.pathname
                            : "";
                        if (
                          roleKey === "ADMIN" &&
                          (currentPath.startsWith("/penawaran") ||
                            currentPath.startsWith("/invoice") ||
                            currentPath.startsWith("/order"))
                        ) {
                          router.push("/produk");
                        }
                      }}
                      className={`w-full text-left flex items-start gap-2.5 p-2 rounded-xl transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#eef4ff] text-[#19376d] font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-[#19376d] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{item.roleLabel}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#19376d]" />}
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal leading-snug mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
