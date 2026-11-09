import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { wrapColumnText, buildProductReportPdfBytes } from '../../src/lib/export-product-pdf';
import { initialProducts } from '../../src/lib/data/mock-products';

describe('Product PDF Export Utility', () => {
  it('harus memecah teks kolom panjang sesuai batas karakter', () => {
    const lines = wrapColumnText('Software ERP Cloud Enterprise Solution', 20);
    assert.ok(lines.length >= 2);
    for (const line of lines) {
      assert.ok(line.length <= 20);
    }
  });

  it("harus menghasilkan dokumen PDF 1.4 untuk katalog produk/jasa dengan pemisah filter '|'", () => {
    const bytes = buildProductReportPdfBytes({
      products: initialProducts.slice(0, 5),
      totalCount: 24,
      activeCount: 22,
      selectedCategory: 'Jasa',
      selectedStatus: 'Aktif',
      searchTerm: '',
    });

    const text = new TextDecoder().decode(bytes);
    assert.ok(text.startsWith('%PDF-1.4\n'));
    assert.ok(text.includes('Kategori: Jasa | Status: Aktif | Cari: Semua'));
    assert.ok(text.includes(initialProducts[0].name));
  });
});
