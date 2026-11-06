import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  roundHalfUp,
  formatFinancialDecimal,
  calculateLineItem,
  calculateQuotationTotals,
  CalculationValidationError,
  EmptyItemsCalculationError,
} from '../src/lib/services/calculation.service';

describe('PRO-48: Financial Calculation Service', () => {
  describe('roundHalfUp() & formatFinancialDecimal()', () => {
    it('membulatkan angka ke atas ketika digit ke-3 adalah 5 (Round-Half-Up)', () => {
      assert.strictEqual(roundHalfUp(12.345), 12.35);
      assert.strictEqual(roundHalfUp(12.344), 12.34);
      assert.strictEqual(roundHalfUp(0.005), 0.01);
      assert.strictEqual(roundHalfUp(0.004), 0.00);
    });

    it('memformat angka desimal ke string 2 digit standar finansial', () => {
      assert.strictEqual(formatFinancialDecimal(194250), '194250.00');
      assert.strictEqual(formatFinancialDecimal(12.3), '12.30');
      assert.strictEqual(formatFinancialDecimal(12.345), '12.35');
    });
  });

  describe('calculateLineItem()', () => {
    it('menghitung baris normal dengan benar tanpa diskon dan tanpa pajak', () => {
      const line = calculateLineItem(2, 50000, 0, 0);
      assert.strictEqual(line.subtotal, 100000);
      assert.strictEqual(line.discount_amount, 0);
      assert.strictEqual(line.net_amount, 100000);
      assert.strictEqual(line.tax_amount, 0);
      assert.strictEqual(line.total_amount, 100000);
    });

    it('menghitung baris dengan diskon dan pajak PPN 11% secara round-half-up', () => {
      // Subtotal = 3 * 25000 = 75000
      // Diskon = 5000 -> Net = 70000
      // Pajak 11% dari 70000 = 7700
      // Total = 77700
      const line = calculateLineItem(3, 25000, 5000, 11);
      assert.strictEqual(line.subtotal, 75000);
      assert.strictEqual(line.discount_amount, 5000);
      assert.strictEqual(line.net_amount, 70000);
      assert.strictEqual(line.tax_amount, 7700);
      assert.strictEqual(line.total_amount, 77700);
    });

    it('membatasi diskon baris maksimal sebesar subtotal (tidak boleh negatif net)', () => {
      const line = calculateLineItem(1, 10000, 15000, 11);
      assert.strictEqual(line.subtotal, 10000);
      assert.strictEqual(line.discount_amount, 10000);
      assert.strictEqual(line.net_amount, 0);
      assert.strictEqual(line.tax_amount, 0);
      assert.strictEqual(line.total_amount, 0);
    });

    it('menolak kuantitas bernilai 0 atau negatif', () => {
      assert.throws(
        () => calculateLineItem(0, 10000),
        CalculationValidationError
      );
      assert.throws(
        () => calculateLineItem(-2, 10000),
        CalculationValidationError
      );
    });

    it('menolak harga satuan negatif', () => {
      assert.throws(
        () => calculateLineItem(1, -500),
        CalculationValidationError
      );
    });

    it('menolak diskon negatif', () => {
      assert.throws(
        () => calculateLineItem(1, 10000, -100),
        CalculationValidationError
      );
    });

    it('menolak tarif pajak negatif atau lebih besar dari 100%', () => {
      assert.throws(
        () => calculateLineItem(1, 10000, 0, -5),
        CalculationValidationError
      );
      assert.throws(
        () => calculateLineItem(1, 10000, 0, 101),
        CalculationValidationError
      );
    });
  });

  describe('calculateQuotationTotals()', () => {
    it('menolak jika daftar item kosong', () => {
      assert.throws(
        () => calculateQuotationTotals([]),
        EmptyItemsCalculationError
      );
      // @ts-expect-error test undefined input
      assert.throws(() => calculateQuotationTotals(undefined), EmptyItemsCalculationError);
    });

    it('menolak diskon dokumen negatif', () => {
      const items = [{ quantity: 1, unit_price: 10000 }];
      assert.throws(
        () => calculateQuotationTotals(items, -500),
        CalculationValidationError
      );
    });

    it('menghitung total akumulasi beberapa item dengan akurat', () => {
      const items = [
        {
          id: 'item-1',
          quantity: 2,
          unit_price: 150000,
          discount_amount: 10000,
          tax_rate: 11,
        },
        {
          id: 'item-2',
          quantity: 1,
          unit_price: 50000,
          discount_amount: 0,
          tax_rate: 0,
        },
      ];

      // Item 1: subtotal=300000, disc=10000, net=290000, tax=31900, total=321900
      // Item 2: subtotal=50000, disc=0, net=50000, tax=0, total=50000
      // Document: subtotal=350000, total_discount=10000, tax_total=31900, grand_total=371900
      const result = calculateQuotationTotals(items, 5000);

      assert.strictEqual(result.items.length, 2);
      assert.strictEqual(result.subtotal, 350000);
      assert.strictEqual(result.total_discount, 10000);
      assert.strictEqual(result.tax_total, 31900);
      assert.strictEqual(result.document_discount, 5000);
      // Grand total = (290000 + 50000) + 31900 - 5000 = 366900
      assert.strictEqual(result.grand_total, 366900);

      assert.strictEqual(result.formatted.subtotal, '350000.00');
      assert.strictEqual(result.formatted.total_discount, '10000.00');
      assert.strictEqual(result.formatted.tax_total, '31900.00');
      assert.strictEqual(result.formatted.document_discount, '5000.00');
      assert.strictEqual(result.formatted.grand_total, '366900.00');
    });

    it('memastikan presisi pembulatan desimal per baris tanpa masalah float akumulatif', () => {
      const items = [
        { quantity: 1, unit_price: 100.05, tax_rate: 11 }, // net 100.05, tax 11.0055 -> 11.01
        { quantity: 1, unit_price: 200.05, tax_rate: 11 }, // net 200.05, tax 22.0055 -> 22.01
      ];

      const result = calculateQuotationTotals(items);
      assert.strictEqual(result.subtotal, 300.10);
      assert.strictEqual(result.tax_total, 33.02);
      assert.strictEqual(result.grand_total, 333.12);
      assert.strictEqual(result.formatted.grand_total, '333.12');
    });
  });
});
