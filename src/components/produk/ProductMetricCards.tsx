"use client";

import React from "react";
import { Archive, Package, UserCog, PauseCircle, AlertTriangle, Layers } from "lucide-react";
import { BusinessMode } from "@/types/product";

export interface ProductMetrics {
  totalCount: number;
  physicalCount: number;
  serviceCount: number;
  inactiveCount: number;
  recentTotalCount: number;
  recentPhysicalCount: number;
  recentServiceCount: number;
  totalWarehouseUnits: number;
  lowStockCount: number;
}

interface ProductMetricCardsProps {
  metrics: ProductMetrics;
  businessMode: BusinessMode;
}

export function ProductMetricCards({ metrics, businessMode }: ProductMetricCardsProps) {
  if (businessMode === "Produk") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Total produk</span>
            <Archive aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-slate-900">{metrics.physicalCount}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Item barang terdaftar</span>
            {metrics.recentPhysicalCount > 0 && (
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                +{metrics.recentPhysicalCount} baru
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Total stok gudang</span>
            <Package aria-hidden="true" className="w-4 h-4 text-[#19376d] shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-[#19376d]">{metrics.totalWarehouseUnits}</div>
          <div className="text-xs text-slate-500">Unit fisik tersedia</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Stok menipis (&le; 5)</span>
            <AlertTriangle aria-hidden="true" className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-amber-600">{metrics.lowStockCount}</div>
          <div className="text-xs text-slate-500">Perlu pengadaan ulang</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Produk nonaktif</span>
            <PauseCircle aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-slate-900">{metrics.inactiveCount}</div>
          <div className="text-xs text-slate-500">Tidak dijual sementara</div>
        </div>
      </div>
    );
  }

  if (businessMode === "Jasa") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Total layanan</span>
            <UserCog aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-slate-900">{metrics.serviceCount}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Layanan terdaftar</span>
            {metrics.recentServiceCount > 0 && (
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                +{metrics.recentServiceCount} baru
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Paket layanan aktif</span>
            <Package aria-hidden="true" className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-emerald-600">
            {metrics.serviceCount - metrics.inactiveCount}
          </div>
          <div className="text-xs text-slate-500">Siap ditawarkan</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Tipe penagihan</span>
            <Layers aria-hidden="true" className="w-4 h-4 text-[#19376d] shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-[#19376d]">5</div>
          <div className="text-xs text-slate-500">Jam, Sesi, Bulan, Proyek, Paket</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Layanan nonaktif</span>
            <PauseCircle aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-3xl font-heading font-bold text-slate-900">{metrics.inactiveCount}</div>
          <div className="text-xs text-slate-500">Perlu peninjauan tarif</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Total katalog</span>
          <Archive aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
        </div>
        <div className="text-3xl font-heading font-bold text-slate-900">{metrics.totalCount}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Item terdaftar</span>
          {metrics.recentTotalCount > 0 && (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              +{metrics.recentTotalCount} baru
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Produk fisik</span>
          <Package aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
        </div>
        <div className="text-3xl font-heading font-bold text-slate-900">{metrics.physicalCount}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Stok: {metrics.totalWarehouseUnits} unit</span>
          {metrics.recentPhysicalCount > 0 && (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              +{metrics.recentPhysicalCount} baru
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Layanan jasa</span>
          <UserCog aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
        </div>
        <div className="text-3xl font-heading font-bold text-slate-900">{metrics.serviceCount}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Paket aktif</span>
          {metrics.recentServiceCount > 0 && (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              +{metrics.recentServiceCount} baru
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Total item nonaktif</span>
          <PauseCircle aria-hidden="true" className="w-4 h-4 text-slate-500 shrink-0" />
        </div>
        <div className="text-3xl font-heading font-bold text-slate-900">{metrics.inactiveCount}</div>
        <div className="text-xs text-slate-500">Perlu ditinjau</div>
      </div>
    </div>
  );
}

