import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialPermintaan,
  findPermintaanById,
  updatePermintaanStatus,
  getStoredPermintaan,
  formatBadgeCount,
} from '../../src/lib/data/mock-permintaan';

describe('Permintaan Unit Test Suite', () => {
  it('harus memuat 10 data permintaan awal (8 Baru dan 2 Sudah ditawarkan)', () => {
    assert.equal(initialPermintaan.length, 10);
    const newItems = initialPermintaan.filter((i) => i.status === 'Baru');
    const offeredItems = initialPermintaan.filter((i) => i.status === 'Sudah ditawarkan');
    assert.equal(newItems.length, 8);
    assert.equal(offeredItems.length, 2);
  });

  it('harus dapat menemukan permintaan berdasarkan ID (findPermintaanById)', () => {
    const item = findPermintaanById('PMT-0005');
    assert.ok(item !== null);
    assert.equal(item?.id, 'PMT-0005');
    assert.equal(item?.customerName, 'PT Maju Bersama');
    assert.equal(item?.ticketId, '#REQ-9919');
  });

  it('harus mengembalikan null jika ID non-PMT tidak ditemukan dan fallback untuk ID PMT baru', () => {
    assert.equal(findPermintaanById('UNKNOWN-9999'), null);
    const fallback = findPermintaanById('PMT-9999');
    assert.equal(fallback?.id, 'PMT-9999');
  });

  it('harus memformat badge count secara dinamis dengan batas 99+', () => {
    assert.equal(formatBadgeCount(0), null);
    assert.equal(formatBadgeCount(-1), null);
    assert.equal(formatBadgeCount(1), '1');
    assert.equal(formatBadgeCount(99), '99');
    assert.equal(formatBadgeCount(100), '99+');
    assert.equal(formatBadgeCount(120), '99+');
  });

  it('harus dapat memperbarui status permintaan (updatePermintaanStatus)', () => {
    const original = findPermintaanById('PMT-0005');
    const originalStatus = original?.status || 'Sudah ditawarkan';

    try {
      const success = updatePermintaanStatus('PMT-0005', 'Baru');
      assert.equal(success, true);

      const updated = findPermintaanById('PMT-0005');
      assert.equal(updated?.status, 'Baru');
    } finally {
      // Kembalikan ke state awal agar test lain tidak terpengaruh
      updatePermintaanStatus('PMT-0005', originalStatus);
    }
  });

  it('harus aman saat getStoredPermintaan dijalankan di environment non-browser (SSR)', () => {
    const items = getStoredPermintaan();
    assert.ok(Array.isArray(items));
    assert.equal(items.length, 10);
  });
});
