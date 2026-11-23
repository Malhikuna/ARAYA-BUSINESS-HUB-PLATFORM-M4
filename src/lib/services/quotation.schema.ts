import { z } from 'zod';

export type QuotationStatus = 'draf' | 'terkirim' | 'disetujui' | 'ditolak';

export const VALID_QUOTATION_STATUSES: QuotationStatus[] = [
  'draf',
  'terkirim',
  'disetujui',
  'ditolak',
];

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidDateInput(value?: string): boolean {
  if (!value) return true;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime());
}

/**
 * Konversi nilai Prisma Decimal / string numerik / number ke string 2 desimal (Round-Half-Up)
 * tanpa aritmetika floating-point JS (NFR-04).
 */
export function formatDecimalValue(value: unknown): string {
  if (value === null || value === undefined) return '0.00';

  if (
    typeof value === 'object' &&
    value !== null &&
    'toFixed' in value &&
    typeof (value as { toFixed: unknown }).toFixed === 'function'
  ) {
    return (value as { toFixed: (digits: number) => string }).toFixed(2);
  }

  const raw = String(value).trim();
  const match = raw.match(/^([+-])?(\d+)(?:\.(\d+))?$/);
  if (!match) return '0.00';

  const sign = match[1] === '-' ? '-' : '';
  const intPart = match[2];
  const fracPart = match[3] || '';
  const padded = fracPart.padEnd(3, '0');
  const twoDigits = padded.slice(0, 2);
  const thirdDigit = Number.parseInt(padded[2], 10);

  let scaled = BigInt(`${intPart}${twoDigits}`);
  if (thirdDigit >= 5) {
    scaled += BigInt(1);
  }

  const scaledStr = scaled.toString().padStart(3, '0');
  const outInt = scaledStr.slice(0, -2);
  const outFrac = scaledStr.slice(-2);
  return `${scaled === BigInt(0) ? '' : sign}${outInt}.${outFrac}`;
}

export const quotationItemSchema = z.object({
  product_service_id: z.string().uuid('ID produk/jasa wajib berupa UUID yang valid.'),
  description: z.string().trim().max(1000).nullable().optional(),
  quantity: z.coerce.number().positive('Kuantitas item harus lebih besar dari 0.'),
  unit_price: z.coerce.number().nonnegative('Harga satuan tidak boleh negatif.'),
  discount_amount: z.coerce.number().nonnegative('Diskon item tidak boleh negatif.').optional().default(0),
  tax_rate: z.coerce.number().min(0, 'Tarif pajak minimal 0%').max(100, 'Tarif pajak maksimal 100%').optional().default(0),
});

export const createQuotationSchema = z
  .object({
    service_request_id: z.string().uuid('ID permintaan jasa wajib berupa UUID yang valid.').optional(),
    customer_id: z.string().uuid('ID pelanggan wajib berupa UUID yang valid.').optional(),
    partner_id: z.string().regex(UUID_REGEX, 'ID partner harus berupa UUID yang valid.').optional(),
    quotation_date: z
      .string()
      .refine(isValidDateInput, 'Format quotation_date tidak valid.')
      .optional(),
    valid_until: z
      .string()
      .refine(isValidDateInput, 'Format valid_until tidak valid.')
      .optional(),
    status: z.enum(['draf', 'terkirim', 'disetujui', 'ditolak'] as const).optional().default('draf'),
    notes: z.string().trim().max(2000).nullable().optional(),
    items: z
      .array(quotationItemSchema)
      .min(1, 'Item penawaran tidak boleh kosong. Minimal satu jasa wajib disertakan.'),
  })
  .superRefine((val, ctx) => {
    if (!val.customer_id && !val.service_request_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customer_id'],
        message: 'ID pelanggan wajib diisi jika tidak menautkan permintaan jasa.',
      });
    }
  });

export const updateQuotationStatusSchema = z.object({
  status: z.enum(['draf', 'terkirim', 'disetujui', 'ditolak'] as const, {
    message: "Status harus bernilai 'draf', 'terkirim', 'disetujui', atau 'ditolak'.",
  }),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export class EmptyQuotationItemsError extends Error {
  code = 'EMPTY_QUOTATION_ITEMS';
  constructor() {
    super('Item penawaran tidak boleh kosong. Minimal satu jasa wajib disertakan.');
    this.name = 'EmptyQuotationItemsError';
  }
}

export class QuotationValidationError extends Error {
  code = 'VALIDATION_ERROR';
  constructor(message: string, public fields: Record<string, string>) {
    super(message);
    this.name = 'QuotationValidationError';
  }
}

export class QuotationNotFoundError extends Error {
  code = 'QUOTATION_NOT_FOUND';
  constructor(id: string) {
    super(`Penawaran dengan ID '${id}' tidak ditemukan.`);
    this.name = 'QuotationNotFoundError';
  }
}

export class InvalidQuotationStatusError extends Error {
  code = 'INVALID_QUOTATION_STATUS';
  constructor(message: string) {
    super(message);
    this.name = 'InvalidQuotationStatusError';
  }
}

export class QuotationConflictError extends Error {
  code = 'QUOTATION_CONFLICT';
  constructor(message: string) {
    super(message);
    this.name = 'QuotationConflictError';
  }
}

export class QuotationForbiddenError extends Error {
  code = 'FORBIDDEN';
  constructor(message: string) {
    super(message);
    this.name = 'QuotationForbiddenError';
  }
}

export interface QuotationDecimalFields {
  subtotal: unknown;
  discount_amount: unknown;
  tax_amount: unknown;
  total_amount: unknown;
  quotation_items?: Array<{
    quantity: unknown;
    unit_price: unknown;
    discount_amount: unknown;
    tax_rate: unknown;
    tax_amount: unknown;
    subtotal: unknown;
    total_amount: unknown;
  }>;
}

/**
 * Konversi seluruh field nominal penawaran menjadi string desimal 2 digit (Round-Half-Up).
 */
export function serializeQuotationFinancials<T extends QuotationDecimalFields>(quotation: T) {
  return {
    ...quotation,
    subtotal: formatDecimalValue(quotation.subtotal),
    discount_amount: formatDecimalValue(quotation.discount_amount),
    tax_amount: formatDecimalValue(quotation.tax_amount),
    total_amount: formatDecimalValue(quotation.total_amount),
    quotation_items: quotation.quotation_items?.map((item) => ({
      ...item,
      quantity: formatDecimalValue(item.quantity),
      unit_price: formatDecimalValue(item.unit_price),
      discount_amount: formatDecimalValue(item.discount_amount),
      tax_rate: formatDecimalValue(item.tax_rate),
      tax_amount: formatDecimalValue(item.tax_amount),
      subtotal: formatDecimalValue(item.subtotal),
      total_amount: formatDecimalValue(item.total_amount),
    })),
  };
}
