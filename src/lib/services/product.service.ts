import { z } from "zod";
import { prisma } from "../prisma";

export const DEFAULT_PARTNER_ID = "00000000-0000-0000-0000-000000000001";

export const createProductSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(3, "SKU minimal 3 karakter.")
    .max(50, "SKU maksimal 50 karakter.")
    .regex(/^[A-Za-z0-9_-]+$/, "SKU hanya boleh berisi huruf, angka, tanda hubung (-), dan garis bawah (_).")
    .transform((val) => val.toUpperCase()),
  name: z.string().trim().min(1, "Nama produk/jasa tidak boleh kosong.").max(150, "Nama produk/jasa maksimal 150 karakter."),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter.").nullable().optional(),
  type: z
    .string()
    .trim()
    .transform((val) => {
      const upper = val.toUpperCase();
      if (upper === "JASA" || upper === "SERVICE") return "SERVICE";
      if (upper === "BARANG" || upper === "PRODUK" || upper === "PRODUCT") return "PRODUCT";
      if (upper === "ASSET" || upper === "ASET") return "ASSET";
      return upper;
    })
    .refine((val) => ["PRODUCT", "SERVICE", "ASSET"].includes(val), {
      message: "Tipe harus bernilai PRODUCT, SERVICE, atau ASSET.",
    }),
  price: z.coerce.number().nonnegative("Harga tidak boleh bernilai negatif.").finite("Harga harus berupa angka yang valid."),
  unit: z.string().trim().max(20, "Satuan maksimal 20 karakter.").default("pcs"),
  stock: z.coerce.number().int("Stok harus bilangan bulat.").nonnegative("Stok tidak boleh negatif.").default(0),
  tax_rate_id: z.string().uuid("ID tarif pajak harus berupa UUID valid.").nullable().optional(),
  partner_id: z.string().uuid("ID Partner harus berupa UUID valid.").optional(),
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
  code = "VALIDATION_ERROR";
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>) {
    super(message);
    this.name = "ProductValidationError";
    this.fields = fields;
  }
}

export class DuplicateSkuError extends Error {
  code = "DUPLICATE_SKU";

  constructor(sku: string) {
    super(`Produk atau jasa dengan SKU '${sku}' sudah terdaftar.`);
    this.name = "DuplicateSkuError";
  }
}

export class ProductNotFoundError extends Error {
  code = "PRODUCT_NOT_FOUND";

  constructor(id: string) {
    super(`Produk atau jasa dengan ID '${id}' tidak ditemukan.`);
    this.name = "ProductNotFoundError";
  }
}

export class ProductHasTransactionsError extends Error {
  code = "CANNOT_DELETE_PRODUCT";

  constructor(message: string) {
    super(message);
    this.name = "ProductHasTransactionsError";
  }
}

export function formatZodError(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root";
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

export async function getProducts(query: GetProductsQuery = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const search = query.search?.trim();

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [{ name: { contains: search, mode: "insensitive" as const } }, { sku: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }];
  }

  if (query.type) {
    where.type = query.type.toUpperCase();
  }

  if (query.is_active !== undefined) {
    where.is_active = query.is_active === true || query.is_active === "true";
  }

  if (query.partner_id) {
    where.partner_id = query.partner_id;
  }

  const [items, total] = await Promise.all([
    prisma.products_services.findMany({
      where,
      skip,
      take: limit,
      include: {
        tax_rates: {
          select: {
            id: true,
            name: true,
            rate: true,
          },
        },
      },
      orderBy: [{ is_active: "desc" }, { created_at: "desc" }],
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
    include: {
      tax_rates: {
        select: {
          id: true,
          name: true,
          rate: true,
        },
      },
    },
  });

  if (!product) {
    throw new ProductNotFoundError(id);
  }

  return product;
}

function withAutoServiceSku(rawInput: unknown): unknown {
  if (!rawInput || typeof rawInput !== "object") return rawInput;
  const obj = rawInput as Record<string, unknown>;
  const rawType = typeof obj.type === "string" ? obj.type.trim().toUpperCase() : "";
  const isService = rawType === "SERVICE" || rawType === "JASA";
  const hasName = typeof obj.name === "string" && obj.name.trim().length > 0;
  const hasSku = typeof obj.sku === "string" && obj.sku.trim().length > 0;
  if (isService && hasName && !hasSku) {
    const period = new Date().toISOString().slice(0, 7).replace("-", "");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return { ...obj, sku: `SRV-${period}-${suffix}`, stock: 0 };
  }
  return rawInput;
}

export async function createProduct(rawInput: unknown, authPartnerId?: string) {
  const parsed = createProductSchema.safeParse(withAutoServiceSku(rawInput));
  if (!parsed.success) {
    throw new ProductValidationError("Data produk/jasa tidak valid.", formatZodError(parsed.error));
  }

  const data = parsed.data;
  const partnerId = authPartnerId || data.partner_id || DEFAULT_PARTNER_ID;

  // Cek duplikasi SKU
  const existingSku = await prisma.products_services.findUnique({
    where: { sku: data.sku },
  });
  if (existingSku) {
    throw new DuplicateSkuError(data.sku);
  }

  // Jika tax_rate_id disertakan, pastikan ada di database
  if (data.tax_rate_id) {
    const taxRate = await prisma.tax_rates.findUnique({
      where: { id: data.tax_rate_id },
    });
    if (!taxRate) {
      throw new ProductValidationError("Data pajak tidak valid.", {
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
      unit: data.unit ?? "pcs",
      stock: data.type === "SERVICE" ? 0 : (data.stock ?? 0),
      price: data.price,
      partner_id: partnerId,
      tax_rate_id: data.tax_rate_id ?? null,
      is_active: data.is_active ?? true,
    },
    include: {
      tax_rates: {
        select: {
          id: true,
          name: true,
          rate: true,
        },
      },
    },
  });
}

export async function updateProduct(id: string, rawInput: unknown) {
  await getProductById(id);

  const parsed = updateProductSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ProductValidationError("Data pembaruan produk/jasa tidak valid.", formatZodError(parsed.error));
  }

  const data = parsed.data;

  // Jika SKU diubah, cek duplikasi
  if (data.sku) {
    const existingSku = await prisma.products_services.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku && existingSku.id !== id) {
      throw new DuplicateSkuError(data.sku);
    }
  }

  // Jika tax_rate_id diubah
  if (data.tax_rate_id) {
    const taxRate = await prisma.tax_rates.findUnique({
      where: { id: data.tax_rate_id },
    });
    if (!taxRate) {
      throw new ProductValidationError("Data pajak tidak valid.", {
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
    include: {
      tax_rates: {
        select: {
          id: true,
          name: true,
          rate: true,
        },
      },
    },
  });
}

export async function deleteProduct(id: string) {
  await getProductById(id);

  // Cek relasi transaksi di quotation_items, invoice_items, atau order_items
  const [quotationItemsCount, invoiceItemsCount, orderItemsCount] = await Promise.all([
    prisma.quotation_items.count({ where: { product_service_id: id } }),
    prisma.invoice_items.count({ where: { product_service_id: id } }),
    prisma.order_items.count({ where: { product_service_id: id } }),
  ]);

  if (quotationItemsCount > 0 || invoiceItemsCount > 0 || orderItemsCount > 0) {
    throw new ProductHasTransactionsError("Produk/jasa tidak dapat dihapus karena tercatat dalam riwayat transaksi penawaran, pesanan, atau tagihan.");
  }

  return prisma.products_services.delete({
    where: { id },
  });
}

export async function createProductsBulk(items: unknown[], authPartnerId?: string) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ProductValidationError("Daftar produk/jasa wajib diisi.", {
      items: "Daftar item tidak boleh kosong.",
    });
  }

  const partnerId = authPartnerId || DEFAULT_PARTNER_ID;
  const validatedItems: CreateProductInput[] = [];
  const skuSet = new Set<string>();

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
    validatedItems.push(parsed.data);
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
          unit: item.unit ?? "pcs",
          stock: item.type === "SERVICE" ? 0 : (item.stock ?? 0),
          price: item.price,
          partner_id: item.partner_id || partnerId,
          tax_rate_id: item.tax_rate_id ?? null,
          is_active: item.is_active ?? true,
        },
      }),
    ),
  );
}
