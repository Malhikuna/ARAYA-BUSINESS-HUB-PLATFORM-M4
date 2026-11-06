/**
 * Calculation Service - Modul 4 (Sales & Invoicing)
 * PRO-48: Service kalkulasi subtotal, diskon baris, PPN (Round-Half-Up), dan grand total.
 * 
 * Aturan Finansial:
 * 1. line_subtotal = quantity * unit_price
 * 2. line_net      = line_subtotal - line_discount
 * 3. line_tax      = ROUND_HALF_UP(line_net * (tax_rate / 100))
 * 4. line_total    = line_net + line_tax
 * 5. grand_total   = sum(line_net) + sum(line_tax) - document_discount
 * 6. Presisi finansial: desimal 2 digit string / NUMERIC(18,2)
 */

export class CalculationValidationError extends Error {
  code = 'CALCULATION_VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'CalculationValidationError';
  }
}

export class EmptyItemsCalculationError extends Error {
  code = 'EMPTY_ITEMS_CALCULATION';
  constructor() {
    super('Kalkulasi gagal: item tidak boleh kosong. Minimal satu item wajib disertakan.');
    this.name = 'EmptyItemsCalculationError';
  }
}

export interface CalculationLineItemInput {
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_rate?: number;
}

export interface CalculatedLineItem<T extends CalculationLineItemInput> {
  item: T;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  subtotal: number;
  net_amount: number;
  tax_amount: number;
  total_amount: number;
}

export interface CalculationSummary<T extends CalculationLineItemInput> {
  items: Array<T & {
    subtotal: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
  }>;
  subtotal: number;
  total_discount: number;
  tax_total: number;
  document_discount: number;
  grand_total: number;
  formatted: {
    subtotal: string;
    total_discount: string;
    tax_total: string;
    document_discount: string;
    grand_total: string;
  };
}

/**
 * Membulatkan angka secara matematis (Round-Half-Up) ke 2 tempat desimal.
 */
export function roundHalfUp(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Format angka numerik ke representasi string 2 desimal standar finansial.
 * Contoh: 194250 -> "194250.00"
 */
export function formatFinancialDecimal(value: number): string {
  return roundHalfUp(value).toFixed(2);
}

/**
 * Menghitung rincian per baris item: subtotal, diskon baris, PPN, dan total baris.
 */
export function calculateLineItem(
  quantity: number,
  unitPrice: number,
  discountAmount = 0,
  taxRate = 0
) {
  if (quantity <= 0) {
    throw new CalculationValidationError('Kuantitas item harus lebih besar dari 0.');
  }
  if (unitPrice < 0) {
    throw new CalculationValidationError('Harga satuan tidak boleh bernilai negatif.');
  }
  if (discountAmount < 0) {
    throw new CalculationValidationError('Diskon item tidak boleh bernilai negatif.');
  }
  if (taxRate < 0 || taxRate > 100) {
    throw new CalculationValidationError('Tarif pajak harus berada di antara 0% dan 100%.');
  }

  const subtotal = roundHalfUp(quantity * unitPrice);
  const discount = Math.min(subtotal, roundHalfUp(discountAmount));
  const netAmount = roundHalfUp(subtotal - discount);
  const taxAmount = roundHalfUp(netAmount * (taxRate / 100));
  const totalAmount = roundHalfUp(netAmount + taxAmount);

  return {
    quantity,
    unit_price: unitPrice,
    discount_amount: discount,
    tax_rate: taxRate,
    subtotal,
    net_amount: netAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
  };
}

/**
 * Menghitung akumulasi seluruh item dokumen (penawaran/invoice):
 * - Subtotal kotor
 * - Total diskon per baris
 * - Total pajak (PPN) hasil penjumlahan round-half-up per baris
 * - Grand total bersih setelah diskon dokumen
 */
export function calculateQuotationTotals<T extends CalculationLineItemInput>(
  items: T[],
  documentDiscount = 0
): CalculationSummary<T> {
  if (!items || items.length === 0) {
    throw new EmptyItemsCalculationError();
  }

  if (documentDiscount < 0) {
    throw new CalculationValidationError('Diskon dokumen tidak boleh bernilai negatif.');
  }

  let subtotal = 0;
  let totalLineDiscount = 0;
  let totalTax = 0;
  let totalNet = 0;

  const calculatedItems = items.map((item) => {
    const line = calculateLineItem(
      item.quantity,
      item.unit_price,
      item.discount_amount || 0,
      item.tax_rate || 0
    );

    subtotal = roundHalfUp(subtotal + line.subtotal);
    totalLineDiscount = roundHalfUp(totalLineDiscount + line.discount_amount);
    totalTax = roundHalfUp(totalTax + line.tax_amount);
    totalNet = roundHalfUp(totalNet + line.net_amount);

    return {
      ...item,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_amount: line.discount_amount,
      tax_rate: line.tax_rate,
      subtotal: line.subtotal,
      tax_amount: line.tax_amount,
      total_amount: line.total_amount,
    };
  });

  const docDiscount = Math.min(
    roundHalfUp(totalNet + totalTax),
    roundHalfUp(documentDiscount)
  );

  const grandTotal = roundHalfUp(totalNet + totalTax - docDiscount);

  return {
    items: calculatedItems,
    subtotal,
    total_discount: totalLineDiscount,
    tax_total: totalTax,
    document_discount: docDiscount,
    grand_total: grandTotal,
    formatted: {
      subtotal: formatFinancialDecimal(subtotal),
      total_discount: formatFinancialDecimal(totalLineDiscount),
      tax_total: formatFinancialDecimal(totalTax),
      document_discount: formatFinancialDecimal(docDiscount),
      grand_total: formatFinancialDecimal(grandTotal),
    },
  };
}
