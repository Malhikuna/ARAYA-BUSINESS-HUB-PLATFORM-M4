import React from "react";
import Link from "next/link";
import { User, Menu } from "lucide-react";
import { GlobalSearchBar } from "@/components/layout/GlobalSearchBar";

export interface NavbarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Navbar({
  isSidebarOpen = true,
  onToggleSidebar,
}: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={
              isSidebarOpen ? "Tutup menu sidebar" : "Buka menu sidebar"
            }
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
      <div className="flex items-center gap-2.5 cursor-pointer select-none">
        <div className="w-8 h-8 rounded-full bg-[#102a54] text-white flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-slate-800">Rani K.</span>
      </div>
    </header>
  );
}
