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

  it('tidak memutasi konstanta initialPermintaan dan tetap menyimpan pembaruan status ke sessionStorage', () => {
    const initialPmt0005 = initialPermintaan.find((i) => i.id === 'PMT-0005');
    assert.equal(initialPmt0005?.status, 'Sudah ditawarkan');

    // Mode SSR (tanpa window): updatePermintaanStatus tidak boleh memutasi initialPermintaan
    const ssrSuccess = updatePermintaanStatus('PMT-0005', 'Baru');
    assert.equal(ssrSuccess, true);
    assert.equal(initialPermintaan.find((i) => i.id === 'PMT-0005')?.status, 'Sudah ditawarkan');

    // Simulasi browser dengan sessionStorage + guard JSON korup/non-array
    const storageMap = new Map<string, string>();
    const prevWindow = (globalThis as { window?: unknown }).window;
    const prevSessionStorage = (globalThis as { sessionStorage?: unknown }).sessionStorage;

    const mockStorage = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, val: string) => { storageMap.set(key, val); },
    };
    const mockWindow = { dispatchEvent: () => true };

    try {
      (globalThis as { window?: unknown }).window = mockWindow;
      (globalThis as { sessionStorage?: unknown }).sessionStorage = mockStorage;

      // Guard isi sessionStorage bukan array -> fallback aman ke salinan initialPermintaan
      storageMap.set('araya_permintaan_list_v7', JSON.stringify({ corrupt: true }));
      assert.equal(getStoredPermintaan().length, 10);

      // Pembaruan status tersimpan di sessionStorage tanpa memutasi initialPermintaan
      const browserSuccess = updatePermintaanStatus('PMT-0005', 'Baru');
      assert.equal(browserSuccess, true);
      assert.equal(findPermintaanById('PMT-0005')?.status, 'Baru');
      assert.equal(initialPermintaan.find((i) => i.id === 'PMT-0005')?.status, 'Sudah ditawarkan');
    } finally {
      if (prevWindow === undefined) delete (globalThis as { window?: unknown }).window;
      else (globalThis as { window?: unknown }).window = prevWindow;
      if (prevSessionStorage === undefined) delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
      else (globalThis as { sessionStorage?: unknown }).sessionStorage = prevSessionStorage;
    }
  });

  it('harus aman saat getStoredPermintaan dijalankan di environment non-browser (SSR) dan mengembalikan salinan baru', () => {
    const items = getStoredPermintaan();
    assert.ok(Array.isArray(items));
    assert.equal(items.length, 10);
    assert.notEqual(items, initialPermintaan);
  });
});
