import { prisma } from '../prisma';
import { partnerExistsInDb, SEEDED_PARTNER_JASA_ID } from './partner-profile.service';
import {
  createProductSchema,
  updateProductSchema,
  ProductValidationError,
  DuplicateSkuError,
  ProductNotFoundError,
  ProductHasTransactionsError,
  formatZodError,
  normalizeProductType,
  type CreateProductInput,
  type UpdateProductInput,
  type GetProductsQuery,
} from './product.schema';

export {
  createProductSchema,
  updateProductSchema,
  ProductValidationError,
  DuplicateSkuError,
  ProductNotFoundError,
  ProductHasTransactionsError,
  formatZodError,
  normalizeProductType,
  type CreateProductInput,
  type UpdateProductInput,
  type GetProductsQuery,
};

const TAX_RATE_SELECT = {
  select: {
    id: true,
    name: true,
    rate: true,
  },
} as const;

export async function getProducts(query: GetProductsQuery = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const search = query.search?.trim();

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { sku: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  if (query.type) {
    where.type = normalizeProductType(query.type);
  }

  if (query.is_active !== undefined) {
    where.is_active = query.is_active === true || query.is_active === 'true';
  }

  if (query.partner_id) {
    where.partner_id = query.partner_id;
  }

  const [items, total] = await Promise.all([
    prisma.products_services.findMany({
      where,
      skip,
      take: limit,
      include: { tax_rates: TAX_RATE_SELECT },
      orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
    }),
    prisma.products_services.count({ where }),
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

export async function getProductById(id: string) {
  const product = await prisma.products_services.findUnique({
    where: { id },
    include: { tax_rates: TAX_RATE_SELECT },
  });

  if (!product) {
    throw new ProductNotFoundError(id);
  }

  return product;
}

function withAutoServiceSku(rawInput: unknown): unknown {
  if (!rawInput || typeof rawInput !== 'object') return rawInput;
  const obj = rawInput as Record<string, unknown>;
  const rawType = typeof obj.type === 'string' ? obj.type.trim().toUpperCase() : '';
  const isService = rawType === 'SERVICE' || rawType === 'JASA';
  const hasName = typeof obj.name === 'string' && obj.name.trim().length > 0;
  const hasSku = typeof obj.sku === 'string' && obj.sku.trim().length > 0;
  if (isService && hasName && !hasSku) {
    const period = new Date().toISOString().slice(0, 7).replace('-', '');
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return { ...obj, sku: `SRV-${period}-${suffix}`, stock: 0 };
  }
  return rawInput;
}

async function assertPartnerReferenceValid(partnerId: string): Promise<void> {
  const exists = await partnerExistsInDb(partnerId);
  if (!exists) {
    throw new ProductValidationError('Partner tidak terdaftar.', {
      partner_id: `Partner dengan ID '${partnerId}' tidak ditemukan di partner_profiles.`,
    });
  }
}

export async function createProduct(rawInput: unknown, authPartnerId?: string) {
  const parsed = createProductSchema.safeParse(withAutoServiceSku(rawInput));
  if (!parsed.success) {
    throw new ProductValidationError('Data produk/jasa tidak valid.', formatZodError(parsed.error));
  }

  const data = parsed.data;
  const partnerId = authPartnerId ?? data.partner_id ?? SEEDED_PARTNER_JASA_ID;
  await assertPartnerReferenceValid(partnerId);

  const existingSku = await prisma.products_services.findUnique({
    where: { sku: data.sku },
  });
  if (existingSku) {
    throw new DuplicateSkuError(data.sku);
  }

  if (data.tax_rate_id) {
    const taxRate = await prisma.tax_rates.findUnique({
      where: { id: data.tax_rate_id },
    });
    if (!taxRate) {
      throw new ProductValidationError('Data pajak tidak valid.', {
        tax_rate_id: `Tarif pajak dengan ID '${data.tax_rate_id}' tidak ditemukan.`,
      });
    }
  }

  return prisma.products_services.create({
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      unit: data.unit ?? 'pcs',
      stock: data.type === 'SERVICE' ? 0 : (data.stock ?? 0),
      price: data.price,
      partner_id: partnerId,
      tax_rate_id: data.tax_rate_id ?? null,
      is_active: data.is_active ?? true,
    },
    include: { tax_rates: TAX_RATE_SELECT },
  });
}

export async function updateProduct(id: string, rawInput: unknown) {
  await getProductById(id);

  const parsed = updateProductSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ProductValidationError('Data pembaruan produk/jasa tidak valid.', formatZodError(parsed.error));
  }

  const data = parsed.data;

  if (data.sku) {
    const existingSku = await prisma.products_services.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku && existingSku.id !== id) {
      throw new DuplicateSkuError(data.sku);
    }
  }

  if (data.tax_rate_id) {
    const taxRate = await prisma.tax_rates.findUnique({
      where: { id: data.tax_rate_id },
    });
    if (!taxRate) {
      throw new ProductValidationError('Data pajak tidak valid.', {
        tax_rate_id: `Tarif pajak dengan ID '${data.tax_rate_id}' tidak ditemukan.`,
      });
    }
  }

  return prisma.products_services.update({
    where: { id },
    data: {
      ...(data.sku && { sku: data.sku }),
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type && { type: data.type }),
      ...(data.unit && { unit: data.unit }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.tax_rate_id !== undefined && { tax_rate_id: data.tax_rate_id }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      updated_at: new Date(),
    },
    include: { tax_rates: TAX_RATE_SELECT },
  });
}

export async function deleteProduct(id: string) {
  await getProductById(id);

  const [quotationItemsCount, invoiceItemsCount, orderItemsCount] = await Promise.all([
    prisma.quotation_items.count({ where: { product_service_id: id } }),
    prisma.invoice_items.count({ where: { product_service_id: id } }),
    prisma.order_items.count({ where: { product_service_id: id } }),
  ]);

  if (quotationItemsCount > 0 || invoiceItemsCount > 0 || orderItemsCount > 0) {
    throw new ProductHasTransactionsError(
      'Produk/jasa tidak dapat dihapus karena tercatat dalam riwayat transaksi penawaran, pesanan, atau tagihan.'
    );
  }

  return prisma.products_services.delete({
    where: { id },
  });
}

export async function createProductsBulk(items: unknown[], authPartnerId?: string) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ProductValidationError('Daftar produk/jasa wajib diisi.', {
      items: 'Daftar item tidak boleh kosong.',
    });
  }

  const validatedItems: CreateProductInput[] = [];
  const skuSet = new Set<string>();
  const partnerIdsToCheck = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const parsed = createProductSchema.safeParse(withAutoServiceSku(items[i]));
    if (!parsed.success) {
      const formatted = formatZodError(parsed.error);
      throw new ProductValidationError(`Baris ke-${i + 1} tidak valid: ${Object.values(formatted)[0]}`, formatted);
    }
    if (skuSet.has(parsed.data.sku)) {
      throw new DuplicateSkuError(parsed.data.sku);
    }
    skuSet.add(parsed.data.sku);
    partnerIdsToCheck.add(authPartnerId ?? parsed.data.partner_id ?? SEEDED_PARTNER_JASA_ID);
    validatedItems.push(parsed.data);
  }

  for (const pid of partnerIdsToCheck) {
    await assertPartnerReferenceValid(pid);
  }

  const existingProducts = await prisma.products_services.findMany({
    where: { sku: { in: Array.from(skuSet) } },
    select: { sku: true },
  });
  if (existingProducts.length > 0) {
    throw new DuplicateSkuError(existingProducts[0].sku);
  }

  return prisma.$transaction(
    validatedItems.map((item) =>
      prisma.products_services.create({
        data: {
          sku: item.sku,
          name: item.name,
          description: item.description ?? null,
          type: item.type,
          unit: item.unit ?? 'pcs',
          stock: item.type === 'SERVICE' ? 0 : (item.stock ?? 0),
          price: item.price,
          partner_id: authPartnerId ?? item.partner_id ?? SEEDED_PARTNER_JASA_ID,
          tax_rate_id: item.tax_rate_id ?? null,
          is_active: item.is_active ?? true,
        },
      })
    )
  );
}
