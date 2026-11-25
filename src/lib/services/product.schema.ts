import { z } from 'zod';

export function normalizeProductType(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const upper = raw.trim().toUpperCase();
  if (upper === 'JASA' || upper === 'SERVICE') return 'SERVICE';
  if (upper === 'BARANG' || upper === 'PRODUK' || upper === 'PRODUCT') return 'PRODUCT';
  if (upper === 'ASSET' || upper === 'ASET') return 'ASSET';
  return upper;
}

export const createProductSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(3, 'SKU minimal 3 karakter.')
    .max(50, 'SKU maksimal 50 karakter.')
    .regex(/^[A-Za-z0-9_-]+$/, 'SKU hanya boleh berisi huruf, angka, tanda hubung (-), dan garis bawah (_).')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, 'Nama produk/jasa tidak boleh kosong.')
    .min(3, 'Nama produk/jasa minimal 3 karakter.')
    .max(150, 'Nama produk/jasa maksimal 150 karakter.')
    .refine((val) => !/^\d+$/.test(val.replace(/\s/g, '')), {
      message: 'Nama produk/jasa tidak boleh hanya berupa angka.',
    })
    .refine((val) => /[a-zA-Z]/.test(val), {
      message: 'Nama produk/jasa harus mengandung huruf.',
    }),
  description: z.string().trim().max(1000, 'Deskripsi maksimal 1000 karakter.').nullable().optional(),
  type: z
    .string()
    .trim()
    .transform((val) => normalizeProductType(val))
    .refine((val) => ['PRODUCT', 'SERVICE', 'ASSET'].includes(val), {
      message: 'Tipe harus bernilai PRODUCT, SERVICE, atau ASSET.',
    }),
  price: z.coerce
    .number()
    .nonnegative('Harga tidak boleh bernilai negatif.')
    .finite('Harga harus berupa angka yang valid.'),
  unit: z.string().trim().max(20, 'Satuan maksimal 20 karakter.').default('pcs'),
  stock: z.coerce.number().int('Stok harus bilangan bulat.').nonnegative('Stok tidak boleh negatif.').default(0),
  tax_rate_id: z.string().uuid('ID tarif pajak harus berupa UUID valid.').nullable().optional(),
  partner_id: z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'ID Partner harus berupa UUID valid.')
    .optional(),
  is_active: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export interface GetProductsQuery {
  search?: string;
  type?: string;
  is_active?: boolean | string;
  page?: number;
  limit?: number;
  partner_id?: string;
}

export class ProductValidationError extends Error {
  code = 'VALIDATION_ERROR';
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>) {
    super(message);
    this.name = 'ProductValidationError';
    this.fields = fields;
  }
}

export class DuplicateSkuError extends Error {
  code = 'DUPLICATE_SKU';

  constructor(sku: string) {
    super(`Produk atau jasa dengan SKU '${sku}' sudah terdaftar.`);
    this.name = 'DuplicateSkuError';
  }
}

export class ProductNotFoundError extends Error {
  code = 'PRODUCT_NOT_FOUND';

  constructor(id: string) {
    super(`Produk atau jasa dengan ID '${id}' tidak ditemukan.`);
    this.name = 'ProductNotFoundError';
  }
}

export class ProductHasTransactionsError extends Error {
  code = 'CANNOT_DELETE_PRODUCT';

  constructor(message: string) {
    super(message);
    this.name = 'ProductHasTransactionsError';
  }
}

export function formatZodError(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'root';
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
