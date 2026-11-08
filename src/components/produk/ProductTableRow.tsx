import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { ProductItem } from "@/types/product";
import { formatRupiah } from "@/lib/format";

export interface ProductTableRowProps {
  item: ProductItem;
  isProductOnly: boolean;
  isServiceOnly: boolean;
  onRequestDelete: (item: ProductItem) => void;
}

/**
 * Baris tabel item katalog produk atau jasa.
 */
export function ProductTableRow({
  item,
  isProductOnly,
  isServiceOnly,
  onRequestDelete,
}: ProductTableRowProps) {
  const router = useRouter();
  const isActive = item.status === "Aktif";
  const isItemProduct = item.category === "Produk";
  const stockCount = item.stock ?? 0;
  const isLowStock = isItemProduct && stockCount <= 5;

  return (
    <tr
      tabIndex={0}
      role="button"
      aria-label={`Lihat detail item ${item.name}`}
      title="Klik baris untuk melihat detail item katalog"
      onClick={() => router.push(`/produk/lihat/${item.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/produk/lihat/${item.id}`);
        }
      }}
      className="hover:bg-[#f5f8ff] focus:bg-[#f5f8ff] outline-none transition-colors cursor-pointer group"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-bold text-slate-900 group-hover:text-[#19376d] transition-colors text-xs sm:text-sm">
          {item.name}
        </div>
        {isItemProduct && !isServiceOnly && (
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">{item.sku}</div>
        )}
      </td>

      {!isProductOnly && !isServiceOnly && (
        <td className="px-6 py-4 whitespace-nowrap text-slate-700">{item.category}</td>
      )}

      {!isServiceOnly && (
        <td className="px-6 py-4 whitespace-nowrap text-center">
          {isItemProduct ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                stockCount === 0
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : isLowStock
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              <span>
                {stockCount} {item.unit || "Unit"}
              </span>
            </span>
          ) : (
            <span className="text-slate-400 select-none text-[11px]">— (Layanan)</span>
          )}
        </td>
      )}

      {isServiceOnly && (
        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
            Per {item.unit || "Paket"}
          </span>
        </td>
      )}

      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900">
        {formatRupiah(item.price)}
      </td>
      <td className="px-6 py-4 text-slate-600 leading-relaxed max-w-md">{item.description}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Aktif</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Nonaktif</span>
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        <div className="inline-flex items-center justify-end gap-1.5">
          <Link
            href={
              isProductOnly
                ? `/produk/ubah/${item.id}?mode=Produk`
                : isServiceOnly
                ? `/produk/ubah/${item.id}?mode=Jasa`
                : `/produk/ubah/${item.id}`
            }
            aria-label={`Ubah item ${item.name}`}
            title="Ubah item katalog"
            className="p-1.5 rounded-lg text-[#19376d] hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>
          <span aria-hidden="true" className="text-slate-300 select-none text-xs">
            |
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(item);
            }}
            aria-label={`Hapus item ${item.name}`}
            title="Hapus item katalog"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

