import { QuotationFormItem } from "@/types/quotation";
import { PermintaanItem } from "@/types/permintaan";
import { ProductItem } from "@/types/product";

export interface QuotationValidationResult {
  isValid: boolean;
  errorMessage: string | null;
  bannerType: "error" | "warning";
  actionHref?: string;
  actionLabel?: string;
}

/**
 * Validasi terpusat formulir Buat Penawaran sesuai PRD (UC-04, BR-06, BR-13):
 * 1. Anti-duplikasi: permintaan berstatus "Sudah ditawarkan" tidak boleh ditawar ulang (BR-13).
 * 2. Kelengkapan: pelanggan wajib ada, minimal 1 item jasa, setiap baris pilih jasa & jumlah >= 1 (UC-04).
 * 3. Integritas katalog: seluruh item wajib bertipe Jasa dan berstatus Aktif (BR-13, UC-04).
 * Partner bebas mengatur jumlah (>= 1) dan menambahkan beberapa jasa aktif sesuai kebutuhan.
 */
export function validateQuotationForm(params: {
  permintaanData: PermintaanItem | null;
  selectedCustomerId: string;
  items: QuotationFormItem[];
  catalogProducts?: ProductItem[];
}): QuotationValidationResult {
  const { permintaanData, selectedCustomerId, items, catalogProducts = [] } = params;

  // 1. Cek anti-duplikasi permintaan (BR-13)
  if (permintaanData && permintaanData.status === "Sudah ditawarkan") {
    const existingQuo =
      permintaanData.quotationNumber ||
      `PNW-${permintaanData.id.replace(/^PMT-?/i, "")}`;
    return {
      isValid: false,
      bannerType: "error",
      errorMessage: `Permintaan ${permintaanData.id} sudah memiliki penawaran resmi (${existingQuo}). Sesuai aturan BR-13, satu permintaan hanya dapat memiliki satu penawaran.`,
      actionHref: `/penawaran/lihat/${existingQuo}`,
      actionLabel: `Lihat penawaran ${existingQuo}`,
    };
  }

  // 2. Cek pelanggan
  if (!selectedCustomerId && !permintaanData) {
    return {
      isValid: false,
      bannerType: "error",
      errorMessage: "Data belum lengkap. Silakan pilih pelanggan terlebih dahulu.",
    };
  }

  // 3. Cek item kosong (UC-04 Exception Flow)
  if (items.length === 0) {
    return {
      isValid: false,
      bannerType: "error",
      errorMessage: "Data belum lengkap. Tambahkan minimal 1 item jasa aktif pada penawaran.",
    };
  }

  // 4. Cek jasa belum dipilih atau jumlah <= 0
  const hasInvalidService = items.some((it) => !it.product_service_id);
  const hasInvalidQty = items.some((it) => !Number.isFinite(it.quantity) || it.quantity <= 0);
  if (hasInvalidService || hasInvalidQty) {
    return {
      isValid: false,
      bannerType: "error",
      errorMessage: "Data belum lengkap. Lengkapi kolom yang ditandai merah (pilih jasa & isi jumlah minimal 1), lalu simpan lagi.",
    };
  }

  // 5. Validasi BR-13 & UC-04: item hanya boleh Jasa aktif (bukan Produk fisik dan bukan Jasa Nonaktif)
  for (const item of items) {
    const catalogMatch = catalogProducts.find((p) => p.id === item.product_service_id);
    const resolvedCategory = catalogMatch?.category || item.category;
    if (resolvedCategory && resolvedCategory !== "Jasa") {
      return {
        isValid: false,
        bannerType: "error",
        errorMessage: `Item "${item.name}" bukan layanan jasa. Sesuai aturan BR-13, penawaran hanya boleh berisi jasa aktif.`,
      };
    }
    if (catalogMatch && catalogMatch.status !== "Aktif") {
      return {
        isValid: false,
        bannerType: "error",
        errorMessage: `Jasa "${catalogMatch.name}" berstatus Nonaktif. Sesuai UC-04, hanya jasa aktif yang boleh dimasukkan ke penawaran.`,
      };
    }
  }

  return {
    isValid: true,
    errorMessage: null,
    bannerType: "error",
  };
}
