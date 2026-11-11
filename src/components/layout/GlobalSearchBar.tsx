"use client";

import React, { useState, useMemo, useRef, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Compass, ArrowUpRight } from "lucide-react";
import { useDevRole, getCustomerPartnerInfo } from "@/lib/auth/dev-role";
import { initialCustomers, subscribeCustomerStorage, getStoredCustomers, getServerStoredCustomers } from "@/lib/data/mock-customers";
import { Customer } from "@/types/customer";

interface QuickMenuLink {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  category: string;
  keywords: string;
}

const QUICK_MENU_LINKS: QuickMenuLink[] = [
  { id: "nav-pelanggan", label: "Daftar pelanggan", subtitle: "Modul Penjualan | Direktori pelanggan & mitra", href: "/pelanggan", category: "Pelanggan", keywords: "pelanggan customer daftar klien partner" },
  { id: "nav-pelanggan-tambah", label: "Tambah pelanggan baru", subtitle: "Formulir | Pendaftaran pelanggan baru", href: "/pelanggan/tambah", category: "Pelanggan", keywords: "tambah buat registrasi pelanggan baru" },
  { id: "nav-produk", label: "Katalog produk & jasa", subtitle: "Katalog | Item fisik & layanan jasa", href: "/produk", category: "Katalog", keywords: "katalog produk jasa daftar item tarif stok" },
  { id: "nav-produk-tambah", label: "Tambah item katalog baru", subtitle: "Formulir | Penambahan katalog baru", href: "/produk/tambah", category: "Katalog", keywords: "tambah buat produk jasa katalog baru" },
  { id: "nav-penawaran", label: "Penawaran penjualan", subtitle: "Transaksi | Dokumen penawaran harga", href: "/penawaran", category: "Transaksi", keywords: "penawaran quotation surat penawaran harga" },
  { id: "nav-invoice", label: "Invoice & penagihan", subtitle: "Transaksi | Faktur & status pembayaran", href: "/invoice", category: "Transaksi", keywords: "invoice tagihan faktur bayar piutang" },
  { id: "nav-order", label: "Order penjualan", subtitle: "Transaksi | Pesanan & pengiriman barang", href: "/order", category: "Transaksi", keywords: "order pesanan surat jalan sales order" },
];

export function GlobalSearchBar() {
  const router = useRouter();
  const { isDev, activeRole } = useDevRole();
  const rawSaved = useSyncExternalStore(subscribeCustomerStorage, getStoredCustomers, getServerStoredCustomers);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const matchedMenus = useMemo(() => {
    const allowedLinks = isDev && activeRole === "ADMIN"
      ? QUICK_MENU_LINKS.filter((l) => l.href.startsWith("/pelanggan") || l.href.startsWith("/produk"))
      : QUICK_MENU_LINKS;

    if (!normalizedQuery) return allowedLinks.slice(0, 5);

    const navMatches = allowedLinks.filter(
      (item) =>
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.subtitle.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.keywords.includes(normalizedQuery)
    );

    if (!isDev) return navMatches;

    let savedList: Customer[] = [];
    try { savedList = JSON.parse(rawSaved); } catch { savedList = []; }
    const allCustomers = [
      ...savedList,
      ...initialCustomers.filter((c) => !savedList.some((s) => s.id === c.id || s.name.toLowerCase() === c.name.toLowerCase())),
    ];
    const roleFiltered = activeRole === "PARTNER_PRODUCT" || activeRole === "PARTNER_SERVICE"
      ? allCustomers.filter((c) => getCustomerPartnerInfo(c.name).partnerRole === activeRole)
      : allCustomers;

    const customerMatches: QuickMenuLink[] = roleFiltered
      .filter((c) => {
        const pInfo = getCustomerPartnerInfo(c.name);
        return (
          c.name.toLowerCase().includes(normalizedQuery) ||
          (c.phone && c.phone.includes(normalizedQuery)) ||
          (c.city && c.city.toLowerCase().includes(normalizedQuery)) ||
          (activeRole === "ADMIN" && pInfo.partnerName.toLowerCase().includes(normalizedQuery))
        );
      })
      .map((c) => {
        const pInfo = getCustomerPartnerInfo(c.name);
        return {
          id: `cust-${c.id}`,
          label: c.name,
          subtitle: activeRole === "ADMIN" ? `Pelanggan | ${pInfo.partnerName} (${pInfo.partnerType}) • ${c.phone}` : `Pelanggan | ${c.city || "Bandung"} • ${c.phone}`,
          href: `/pelanggan/lihat/${c.id}`,
          category: "Pelanggan",
          keywords: c.name.toLowerCase(),
        };
      });

    return [...customerMatches, ...navMatches];
  }, [normalizedQuery, isDev, activeRole, rawSaved]);

  const handleSelectRoute = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "Enter" && normalizedQuery && matchedMenus.length > 0) {
      e.preventDefault();
      handleSelectRoute(matchedMenus[0].href);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-6 hidden sm:block">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="global-search-results"
          aria-label="Cari menu atau halaman penawaran dan tagihan"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cari..."
          className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#19376d] focus:ring-1 focus:ring-[#19376d] transition-all"
        />
        {query && (
          <button
            type="button"
            aria-label="Bersihkan pencarian"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-50 max-h-96 overflow-y-auto custom-scrollbar animate-fade-in"
        >
          {normalizedQuery && matchedMenus.length === 0 ? (
            <div className="p-6 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-800">
                Tidak ditemukan hasil untuk &ldquo;{query.trim()}&rdquo;
              </p>
              <p className="text-[11px] text-slate-500">
                Coba cari dengan kata kunci seperti &quot;pelanggan&quot;, &quot;produk&quot;, &quot;penawaran&quot;, atau &quot;invoice&quot;.
              </p>
            </div>
          ) : (
            <div className="p-2 divide-y divide-slate-100">
              <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Compass className="w-3 h-3 text-slate-500" />
                <span>{normalizedQuery ? "Hasil Pencarian Navigasi" : "Pintasan Cepat Modul Penjualan"}</span>
              </div>
              <div className="pt-1 space-y-0.5">
                {matchedMenus.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => handleSelectRoute(menu.href)}
                    className="w-full px-2.5 py-2 rounded-xl hover:bg-[#f0f4fa] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-[#19376d] truncate">
                        {menu.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{menu.subtitle}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#19376d] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
