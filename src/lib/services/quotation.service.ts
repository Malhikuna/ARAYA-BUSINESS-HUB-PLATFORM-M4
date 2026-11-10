import { z } from 'zod';
import { prisma } from '../prisma';
import { calculateQuotationTotals, roundHalfUp } from './calculation.service';

export { calculateQuotationTotals, roundHalfUp };

export const DEFAULT_PARTNER_ID = '00000000-0000-0000-0000-000000000001';

export type QuotationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export const VALID_QUOTATION_STATUSES: QuotationStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
];

export const quotationItemSchema = z.object({
  product_service_id: z.string().uuid('ID produk/jasa wajib berupa UUID yang valid.'),
  description: z.string().trim().max(1000).nullable().optional(),
  quantity: z.coerce.number().positive('Kuantitas item harus lebih besar dari 0.'),
  unit_price: z.coerce.number().nonnegative('Harga satuan tidak boleh negatif.'),
  discount_amount: z.coerce.number().nonnegative('Diskon item tidak boleh negatif.').optional().default(0),
  tax_rate: z.coerce.number().min(0, 'Tarif pajak minimal 0%').max(100, 'Tarif pajak maksimal 100%').optional().default(0),
});

export const createQuotationSchema = z.object({
  customer_id: z.string().uuid('ID pelanggan wajib berupa UUID yang valid.'),
  partner_id: z.string().uuid('ID partner harus berupa UUID yang valid.').optional(),
  quotation_date: z.string().optional(),
  valid_until: z.string().optional(),
  status: z
    .enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const)
    .optional()
    .default('PENDING_APPROVAL'),
  notes: z.string().trim().max(2000).nullable().optional(),
  items: z.array(quotationItemSchema).min(1, 'Item penawaran tidak boleh kosong. Minimal satu produk/jasa wajib disertakan.'),
});

export const updateQuotationStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const, {
    message: "Status harus bernilai 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', atau 'REJECTED'.",
  }),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export class EmptyQuotationItemsError extends Error {
  code = 'EMPTY_QUOTATION_ITEMS';
  constructor() {
    super('Item penawaran tidak boleh kosong. Minimal satu produk/jasa wajib disertakan.');
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

export async function generateQuotationNumber(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const period = `${year}${month}`;

  const seq = await tx.document_sequences.upsert({
    where: {
      document_type_period: {
        document_type: 'QUOTATION',
        period,
      },
    },
    update: {
      last_number: { increment: 1 },
      updated_at: new Date(),
    },
    create: {
      document_type: 'QUOTATION',
      period,
      last_number: 1,
    },
  });

  const paddedSequence = String(seq.last_number).padStart(4, '0');
  return `PNW-${period}-${paddedSequence}`;
}

export async function getQuotations(query: {
  search?: string;
  status?: string;
  customer_id?: string;
  partner_id?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { quotation_number: { contains: s, mode: 'insensitive' as const } },
      { customers: { name: { contains: s, mode: 'insensitive' as const } } },
    ];
  }

  if (query.status) where.status = query.status.toUpperCase();
  if (query.customer_id) where.customer_id = query.customer_id;
  if (query.partner_id) where.partner_id = query.partner_id;

  const [items, total] = await Promise.all([
    prisma.quotations.findMany({
      where,
      skip,
      take: limit,
      include: {
        customers: {
          select: { id: true, name: true, email: true, phone: true },
        },
        quotation_items: {
          include: {
            products_services: {
              select: { id: true, sku: true, name: true, type: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.quotations.count({ where }),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getQuotationById(id: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const quotation = await prisma.quotations.findFirst({
    where: isUuid ? { OR: [{ id }, { quotation_number: id }] } : { quotation_number: id },
    include: {
      customers: true,
      quotation_items: {
        include: {
          products_services: true,
        },
      },
    },
  });

  if (!quotation) {
    throw new QuotationNotFoundError(id);
  }

  return quotation;
}

export async function createQuotation(rawInput: unknown, authPartnerId?: string) {
  const parsed = createQuotationSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join('.') || 'root'] = issue.message;
    }
    throw new QuotationValidationError('Data penawaran tidak valid.', fields);
  }

  const data = parsed.data;
  const partnerId = authPartnerId || data.partner_id || DEFAULT_PARTNER_ID;

  // 1. Verifikasi Pelanggan
  const customer = await prisma.customers.findUnique({
    where: { id: data.customer_id },
  });
  if (!customer) {
    throw new QuotationValidationError('Pelanggan tidak ditemukan.', {
      customer_id: `Pelanggan dengan ID '${data.customer_id}' tidak ditemukan.`,
    });
  }

  // 2. Verifikasi Keberadaan Seluruh Produk/Jasa
  const productIds = Array.from(new Set(data.items.map((it) => it.product_service_id)));
  const existingProducts = await prisma.products_services.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, is_active: true },
  });
  const foundProductIds = new Set(existingProducts.map((p) => p.id));
  const missingProductIds = productIds.filter((id) => !foundProductIds.has(id));

  if (missingProductIds.length > 0) {
    throw new QuotationValidationError('Produk atau jasa tidak ditemukan.', {
      product_service_id: `Produk/jasa dengan ID '${missingProductIds.join(', ')}' tidak terdaftar di sistem.`,
    });
  }

  // 3. Kalkulasi Finansial (Round-Half-Up, Non-Float) via Calculation Service (PRO-48)
  const totals = calculateQuotationTotals(data.items);

  // 4. Simpan dalam Prisma Transaction Atomik
  return prisma.$transaction(async (tx) => {
    const quotationNumber = await generateQuotationNumber(tx);

    const quotation = await tx.quotations.create({
      data: {
        quotation_number: quotationNumber,
        customer_id: data.customer_id,
        partner_id: partnerId,
        quotation_date: data.quotation_date ? new Date(data.quotation_date) : new Date(),
        valid_until: data.valid_until ? new Date(data.valid_until) : null,
        status: data.status || 'PENDING_APPROVAL',
        subtotal: totals.subtotal,
        discount_amount: totals.discount_amount,
        tax_amount: totals.tax_amount,
        total_amount: totals.total_amount,
        notes: data.notes ?? null,
        quotation_items: {
          create: totals.calculatedItems.map((it) => ({
            product_service_id: it.product_service_id,
            description: it.description ?? null,
            quantity: it.quantity,
            unit_price: it.unit_price,
            discount_amount: it.discount_amount,
            tax_rate: it.tax_rate,
            subtotal: it.subtotal,
            tax_amount: it.tax_amount,
            total_amount: it.total_amount,
          })),
        },
      },
      include: {
        customers: true,
        quotation_items: {
          include: {
            products_services: true,
          },
        },
      },
    });

    return quotation;
  });
}

export async function updateQuotationStatus(id: string, newStatus: QuotationStatus) {
  const quotation = await getQuotationById(id);

  if (quotation.status === 'APPROVED' && newStatus !== 'APPROVED') {
    throw new InvalidQuotationStatusError('Penawaran yang sudah berstatus APPROVED tidak dapat diubah lagi.');
  }

  return prisma.quotations.update({
    where: { id: quotation.id },
    data: {
      status: newStatus,
      updated_at: new Date(),
    },
    include: {
      customers: true,
      quotation_items: true,
    },
  });
}
