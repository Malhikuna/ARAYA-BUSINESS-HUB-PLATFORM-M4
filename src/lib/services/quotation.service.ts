import { prisma } from '../prisma';
import { calculateQuotationTotals, roundHalfUp } from './calculation.service';
import { partnerExistsInDb, SEEDED_PARTNER_JASA_ID } from './partner-profile.service';
import {
  createQuotationSchema,
  UUID_REGEX,
  QuotationConflictError,
  QuotationForbiddenError,
  QuotationNotFoundError,
  QuotationValidationError,
  InvalidQuotationStatusError,
  serializeQuotationFinancials,
  type QuotationStatus,
} from './quotation.schema';

export { calculateQuotationTotals, roundHalfUp };
export * from './quotation.schema';

const QUOTATION_INCLUDE = {
  customers: true,
  service_requests: {
    select: { id: true, title: true, status: true, customer_user_id: true },
  },
  quotation_items: {
    include: {
      products_services: true,
    },
  },
} as const;

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function generateQuotationNumber(tx: PrismaTx): Promise<string> {
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const seq = await tx.document_sequences.upsert({
    where: {
      document_type_period: {
        document_type: 'QUOTATION',
        period,
      },
    },
    update: { last_number: { increment: 1 }, updated_at: new Date() },
    create: { document_type: 'QUOTATION', period, last_number: 1 },
  });

  return `PNW-${period}-${String(seq.last_number).padStart(4, '0')}`;
}

export async function getQuotations(query: {
  search?: string;
  status?: string;
  customer_id?: string;
  customer_user_id?: string;
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
  if (query.status) where.status = query.status.trim().toLowerCase();
  if (query.customer_id) where.customer_id = query.customer_id;
  if (query.partner_id) where.partner_id = query.partner_id;
  if (query.customer_user_id) {
    where.customers = { user_id: query.customer_user_id };
  }

  const [items, total] = await Promise.all([
    prisma.quotations.findMany({
      where,
      skip,
      take: limit,
      include: {
        customers: { select: { id: true, user_id: true, name: true, email: true, phone: true } },
        service_requests: { select: { id: true, title: true, status: true } },
        quotation_items: {
          include: { products_services: { select: { id: true, sku: true, name: true, type: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.quotations.count({ where }),
  ]);

  return {
    items: items.map((item) => serializeQuotationFinancials(item)),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getQuotationById(id: string) {
  const isUuid = UUID_REGEX.test(id);
  const quotation = await prisma.quotations.findFirst({
    where: isUuid ? { OR: [{ id }, { quotation_number: id }] } : { quotation_number: id },
    include: QUOTATION_INCLUDE,
  });

  if (!quotation) {
    throw new QuotationNotFoundError(id);
  }
  return serializeQuotationFinancials(quotation);
}

async function resolveServiceRequestForQuotation(
  tx: PrismaTx,
  serviceRequestId: string,
  partnerId: string,
  explicitCustomerId?: string
): Promise<string> {
  const req = await tx.service_requests.findUnique({
    where: { id: serviceRequestId },
    include: { quotations: { select: { id: true, quotation_number: true } } },
  });

  if (!req) {
    throw new QuotationValidationError('Permintaan jasa tidak ditemukan.', {
      service_request_id: `Permintaan jasa dengan ID '${serviceRequestId}' tidak terdaftar.`,
    });
  }
  if (req.partner_id !== partnerId) {
    throw new QuotationForbiddenError('Anda tidak memiliki akses ke permintaan jasa partner lain.');
  }
  if (req.quotations || req.status !== 'baru') {
    throw new QuotationConflictError(
      `Permintaan jasa ini sudah memiliki penawaran atau berstatus '${req.status}'.`
    );
  }

  if (explicitCustomerId) {
    if (req.customer_id && req.customer_id !== explicitCustomerId) {
      throw new QuotationValidationError('Pelanggan tidak sesuai dengan permintaan jasa.', {
        customer_id: 'customer_id tidak cocok dengan pelanggan pada permintaan jasa.',
      });
    }
    return explicitCustomerId;
  }

  if (req.customer_id) return req.customer_id;

  const normalizedReqEmail = req.customer_email.trim().toLowerCase();
  const existing = await tx.customers.findFirst({
    where: {
      OR: [
        { email: { equals: normalizedReqEmail, mode: 'insensitive' } },
        { phone: req.customer_phone },
      ],
    },
  });
  if (existing) {
    if (existing.user_id && req.customer_user_id && existing.user_id !== req.customer_user_id) {
      throw new QuotationConflictError(
        'Data pelanggan dengan email/nomor ini sudah tertaut ke akun Customer lain.'
      );
    }
    if (!existing.user_id && req.customer_user_id) {
      await tx.customers.update({
        where: { id: existing.id },
        data: { user_id: req.customer_user_id, updated_at: new Date() },
      });
    }
    return existing.id;
  }

  const created = await tx.customers.create({
    data: {
      user_id: req.customer_user_id,
      name: req.customer_name,
      email: req.customer_email.toLowerCase(),
      phone: req.customer_phone,
    },
  });
  return created.id;
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
  const partnerId = authPartnerId ?? data.partner_id ?? SEEDED_PARTNER_JASA_ID;
  if (!(await partnerExistsInDb(partnerId))) {
    throw new QuotationValidationError('Partner tidak terdaftar.', {
      partner_id: `Partner dengan ID '${partnerId}' tidak ditemukan di partner_profiles.`,
    });
  }

  // Validasi seluruh item wajib berupa Jasa aktif (type = 'SERVICE', is_active = true) milik Partner
  const productIds = Array.from(new Set(data.items.map((it) => it.product_service_id)));
  const existingProducts = await prisma.products_services.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, type: true, is_active: true, partner_id: true },
  });
  const productMap = new Map(existingProducts.map((p) => [p.id, p]));
  const missingIds = productIds.filter((id) => !productMap.has(id));
  if (missingIds.length > 0) {
    throw new QuotationValidationError('Produk atau jasa tidak ditemukan.', {
      product_service_id: `Item dengan ID '${missingIds.join(', ')}' tidak terdaftar di sistem.`,
    });
  }

  const invalidItems = existingProducts.filter(
    (p) => p.type !== 'SERVICE' || !p.is_active || p.partner_id !== partnerId
  );
  if (invalidItems.length > 0) {
    throw new QuotationValidationError(
      'Penawaran hanya dapat menggunakan item Jasa aktif milik Partner.',
      {
        items: `Item '${invalidItems.map((i) => i.name).join(', ')}' bukan Jasa aktif milik Partner.`,
      }
    );
  }

  const totals = calculateQuotationTotals(data.items);

  const created = await prisma.$transaction(async (tx) => {
    let customerId = data.customer_id;

    if (data.service_request_id) {
      customerId = await resolveServiceRequestForQuotation(
        tx,
        data.service_request_id,
        partnerId,
        customerId
      );
    }

    if (!customerId) {
      throw new QuotationValidationError('Pelanggan tidak ditemukan.', {
        customer_id: 'ID pelanggan wajib diisi.',
      });
    }

    const customer = await tx.customers.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new QuotationValidationError('Pelanggan tidak ditemukan.', {
        customer_id: `Pelanggan dengan ID '${customerId}' tidak ditemukan.`,
      });
    }

    const quotationNumber = await generateQuotationNumber(tx);
    const quotation = await tx.quotations.create({
      data: {
        quotation_number: quotationNumber,
        service_request_id: data.service_request_id ?? null,
        customer_id: customerId,
        partner_id: partnerId,
        quotation_date: data.quotation_date ? new Date(data.quotation_date) : new Date(),
        valid_until: data.valid_until ? new Date(data.valid_until) : null,
        status: 'draf',
        subtotal: totals.formatted.subtotal,
        discount_amount: totals.formatted.total_discount,
        tax_amount: totals.formatted.tax_total,
        total_amount: totals.formatted.grand_total,
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
      include: QUOTATION_INCLUDE,
    });

    if (data.service_request_id) {
      const updatedReq = await tx.service_requests.updateMany({
        where: { id: data.service_request_id, status: 'baru' },
        data: { status: 'sudah_ditawarkan', customer_id: customerId, updated_at: new Date() },
      });
      if (updatedReq.count === 0) {
        throw new QuotationConflictError('Permintaan jasa sudah dibuatkan penawaran.');
      }
    }

    return quotation;
  });

  return serializeQuotationFinancials(created);
}

export async function updateQuotationStatus(
  id: string,
  newStatus: QuotationStatus,
  actor: { isAdmin?: boolean } = {}
) {
  const quotation = await getQuotationById(id);

  if (quotation.status === 'disetujui' || quotation.status === 'ditolak') {
    if (quotation.status !== newStatus) {
      throw new InvalidQuotationStatusError(
        `Penawaran yang sudah berstatus '${quotation.status}' bersifat final dan tidak dapat diubah lagi.`
      );
    }
  }

  if (newStatus === 'disetujui' && !actor.isAdmin) {
    throw new QuotationForbiddenError(
      'Partner tidak dapat menyetujui penawaran sendiri. Persetujuan hanya dapat dilakukan oleh Customer (BR-06).'
    );
  }

  const allowedTransitions: Record<string, QuotationStatus[]> = {
    draf: ['draf', 'terkirim', 'ditolak'],
    terkirim: ['terkirim', 'disetujui', 'ditolak'],
    disetujui: ['disetujui'],
    ditolak: ['ditolak'],
  };

  const allowedNext = allowedTransitions[quotation.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new InvalidQuotationStatusError(
      `Transisi status tidak valid dari '${quotation.status}' ke '${newStatus}'.`
    );
  }

  const now = new Date();
  const updated = await prisma.quotations.update({
    where: { id: quotation.id },
    data: {
      status: newStatus,
      ...(newStatus === 'terkirim' && !quotation.sent_at ? { sent_at: now } : {}),
      ...(newStatus === 'disetujui' && !quotation.approved_at ? { approved_at: now } : {}),
      updated_at: now,
    },
    include: QUOTATION_INCLUDE,
  });

  return serializeQuotationFinancials(updated);
}
