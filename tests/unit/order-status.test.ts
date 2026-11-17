import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type OrderStatus = 'baru' | 'diproses' | 'selesai';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  baru: ['diproses'],
  diproses: ['selesai'],
  selesai: [],
};

// TODO(PRO-64 & PRO-69): Ganti helper lokal dengan import dari service produksi di src/lib/services/
/**
 * Kontrak aturan bisnis BR-09 / BRQ-09:
 * Status order hanya bergerak satu arah: baru -> diproses -> selesai (selesai final).
 */
function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}

describe('M4-US4 / PRO-68: Order Status Transition Test Suite (TDD Prep)', () => {
  describe('1. Kontrak State Machine Order (BR-09 / BRQ-09)', () => {
    it('UT-ORD-01: mengizinkan transisi maju baru -> diproses dan diproses -> selesai', () => {
      assert.equal(canTransitionOrderStatus('baru', 'diproses'), true);
      assert.equal(canTransitionOrderStatus('diproses', 'selesai'), true);
    });

    it('UT-ORD-02: menolak transisi loncat, mundur, same-state, maupun status tak dikenal', () => {
      assert.equal(canTransitionOrderStatus('baru', 'selesai'), false);
      assert.equal(canTransitionOrderStatus('diproses', 'baru'), false);
      assert.equal(canTransitionOrderStatus('baru', 'baru'), false);
      assert.equal(canTransitionOrderStatus('diproses', 'diproses'), false);
      assert.equal(canTransitionOrderStatus('dibatalkan' as OrderStatus, 'diproses'), false);
    });

    it('UT-ORD-03: menolak perubahan apa pun jika order sudah berstatus selesai (final)', () => {
      assert.equal(canTransitionOrderStatus('selesai', 'baru'), false);
      assert.equal(canTransitionOrderStatus('selesai', 'diproses'), false);
      assert.equal(canTransitionOrderStatus('selesai', 'selesai'), false);
    });
  });

  describe('2. Endpoint PATCH /api/m4/v1/orders/[id]/status (PRO-64) — Menunggu Implementasi Backend', () => {
    it.todo('TC-M4US4-01 (US4-AC1 / IT-ORD-05): Partner mengubah status baru -> diproses -> selesai & status_updated_at tercatat');
    it.todo('U-01: menolak transisi baru -> diproses apabila invoice terkait belum berstatus PAID');
    it.todo('TC-M4US4-02 (US4-AC2 / IT-ORD-06): API menolak perubahan status jika order sudah selesai (HTTP 422 ORDER_ALREADY_COMPLETED)');
    it.todo('IT-ORD-07: Partner tidak dapat mengubah status order milik partner_id lain (HTTP 403 / BR-03)');
  });
});
