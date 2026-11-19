import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialPermintaan,
  findPermintaanById,
  updatePermintaanStatus,
  getStoredPermintaan,
} from '../../src/lib/data/mock-permintaan';

describe('Permintaan Unit Test Suite', () => {
  it('harus memuat 12 data permintaan awal sesuai katalog', () => {
    assert.equal(initialPermintaan.length, 12);
    const newItems = initialPermintaan.filter((i) => i.status === 'Baru');
    const offeredItems = initialPermintaan.filter((i) => i.status === 'Sudah ditawarkan');
    assert.equal(newItems.length, 3);
    assert.equal(offeredItems.length, 9);
  });

  it('harus dapat menemukan permintaan berdasarkan ID (findPermintaanById)', () => {
    const item = findPermintaanById('PMT-0007');
    assert.ok(item !== null);
    assert.equal(item?.id, 'PMT-0007');
    assert.equal(item?.customerName, 'PT Maju Bersama');
    assert.equal(item?.ticketId, '#REQ-9921');
  });

  it('harus mengembalikan null jika ID permintaan tidak ditemukan', () => {
    const item = findPermintaanById('PMT-9999');
    assert.equal(item, null);
  });

  it('harus dapat memperbarui status permintaan (updatePermintaanStatus)', () => {
    const success = updatePermintaanStatus('PMT-0007', 'Sudah ditawarkan');
    assert.equal(success, true);

    const updated = findPermintaanById('PMT-0007');
    assert.equal(updated?.status, 'Sudah ditawarkan');

    // Kembalikan ke state awal
    updatePermintaanStatus('PMT-0007', 'Baru');
  });

  it('harus aman saat getStoredPermintaan dijalankan di environment non-browser (SSR)', () => {
    const items = getStoredPermintaan();
    assert.ok(Array.isArray(items));
    assert.equal(items.length, 12);
  });
});
