import { z } from 'zod';
import { prisma } from '../prisma';

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
  fields: Record<string, string>;
  constructor(message: string, fields: Record<string, string>) {
    super(message);
    this.name = 'QuotationValidationError';
    this.fields = fields;
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

export function roundHalfUp(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateQuotationTotals<
  T extends {
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    tax_rate?: number;
  }
>(items: T[]) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  const calculatedItems = items.map((item) => {
    const qty = item.quantity;
    const price = item.unit_price;
    const itemSubtotal = roundHalfUp(qty * price);
    const itemDiscount = Math.min(itemSubtotal, roundHalfUp(item.discount_amount || 0));
    const netAmount = roundHalfUp(itemSubtotal - itemDiscount);
    const rate = item.tax_rate || 0;
    const itemTax = roundHalfUp(netAmount * (rate / 100));
    const itemTotal = roundHalfUp(netAmount + itemTax);

    subtotal = roundHalfUp(subtotal + itemSubtotal);
    totalDiscount = roundHalfUp(totalDiscount + itemDiscount);
    totalTax = roundHalfUp(totalTax + itemTax);

    return {
      ...item,
      quantity: qty,
      unit_price: price,
      discount_amount: itemDiscount,
      tax_rate: rate,
      subtotal: itemSubtotal,
      tax_amount: itemTax,
      total_amount: itemTotal,
    };
  });

  const grandTotal = roundHalfUp(subtotal - totalDiscount + totalTax);

  return {
    calculatedItems,
    subtotal,
    discount_amount: totalDiscount,
    tax_amount: totalTax,
    total_amount: grandTotal,
  };
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
      last_number: BigInt(1),
    },
  });

  const formattedNum = String(seq.last_number).padStart(4, '0');
  return `PNW-${year}-${formattedNum}`;
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

  if (query.status) {
    where.status = query.status.toUpperCase();
  }

  if (query.customer_id) {
    where.customer_id = query.customer_id;
  }

  if (query.partner_id) {
    where.partner_id = query.partner_id;
  }

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
  const quotation = await prisma.quotations.findUnique({
    where: { id },
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

  // 2. Kalkulasi Finansial (Round-Half-Up, Non-Float)
  const totals = calculateQuotationTotals(data.items);

  // 3. Simpan dalam Prisma Transaction Atomik
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
    where: { id },
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
