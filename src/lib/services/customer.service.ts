import { prisma } from '../prisma';

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  address?: string | null;
}

export interface GetCustomersQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export class CustomerValidationError extends Error {
  code = 'VALIDATION_ERROR';
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>) {
    super(message);
    this.name = 'CustomerValidationError';
    this.fields = fields;
  }
}

export class DuplicateCustomerError extends Error {
  code: string;
  field: 'email' | 'phone';

  constructor(field: 'email' | 'phone', message: string) {
    super(message);
    this.name = 'DuplicateCustomerError';
    this.field = field;
    this.code = field === 'email' ? 'DUPLICATE_EMAIL' : 'DUPLICATE_PHONE';
  }
}

export class CustomerNotFoundError extends Error {
  code = 'CUSTOMER_NOT_FOUND';

  constructor(id: string) {
    super(`Pelanggan dengan ID '${id}' tidak ditemukan.`);
    this.name = 'CustomerNotFoundError';
  }
}

export class CustomerHasTransactionsError extends Error {
  code = 'CANNOT_DELETE_CUSTOMER';

  constructor(message: string) {
    super(message);
    this.name = 'CustomerHasTransactionsError';
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CLEAN_REGEX = /^[+0-9\s-]{8,20}$/;

export function validateCustomerInput(input: Partial<CustomerInput>, isUpdate = false): CustomerInput {
  const fields: Record<string, string> = {};

  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();
  const address = input.address !== undefined ? input.address?.trim() ?? null : undefined;

  if (!isUpdate || input.name !== undefined) {
    if (!name) {
      fields.name = 'Nama pelanggan wajib diisi.';
    } else if (name.length > 150) {
      fields.name = 'Nama pelanggan maksimal 150 karakter.';
    }
  }

  if (!isUpdate || input.email !== undefined) {
    if (!email) {
      fields.email = 'Email pelanggan wajib diisi.';
    } else if (!EMAIL_REGEX.test(email)) {
      fields.email = 'Format email pelanggan tidak valid.';
    } else if (email.length > 255) {
      fields.email = 'Email pelanggan maksimal 255 karakter.';
    }
  }

  if (!isUpdate || input.phone !== undefined) {
    if (!phone) {
      fields.phone = 'Nomor telepon pelanggan wajib diisi.';
    } else if (!PHONE_CLEAN_REGEX.test(phone)) {
      fields.phone = 'Nomor telepon minimal 8 digit dan hanya boleh angka/tanda +.';
    } else if (phone.length > 20) {
      fields.phone = 'Nomor telepon maksimal 20 karakter.';
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new CustomerValidationError('Data pelanggan tidak valid.', fields);
  }

  return {
    name: name as string,
    email: email as string,
    phone: phone as string,
    address,
  };
}

export async function getCustomers(query: GetCustomersQuery = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const search = query.search?.trim();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customers.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.customers.count({ where }),
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

export async function getCustomerById(id: string) {
  const customer = await prisma.customers.findUnique({
    where: { id },
  });

  if (!customer) {
    throw new CustomerNotFoundError(id);
  }

  return customer;
}

export async function createCustomer(rawInput: CustomerInput) {
  const valid = validateCustomerInput(rawInput);

  // 1. Cek duplikasi email
  const existingEmail = await prisma.customers.findUnique({
    where: { email: valid.email },
  });
  if (existingEmail) {
    throw new DuplicateCustomerError('email', 'Pelanggan dengan email tersebut sudah terdaftar.');
  }

  // 2. Cek duplikasi telepon
  const existingPhone = await prisma.customers.findUnique({
    where: { phone: valid.phone },
  });
  if (existingPhone) {
    throw new DuplicateCustomerError('phone', 'Pelanggan dengan nomor telepon tersebut sudah terdaftar.');
  }

  // 3. Simpan pelanggan baru
  return prisma.customers.create({
    data: {
      name: valid.name,
      email: valid.email,
      phone: valid.phone,
      address: valid.address || null,
    },
  });
}

export async function updateCustomer(id: string, rawInput: Partial<CustomerInput>) {
  await getCustomerById(id);
  const valid = validateCustomerInput(rawInput, true);

  if (valid.email) {
    const existingEmail = await prisma.customers.findUnique({
      where: { email: valid.email },
    });
    if (existingEmail && existingEmail.id !== id) {
      throw new DuplicateCustomerError('email', 'Pelanggan dengan email tersebut sudah terdaftar.');
    }
  }

  if (valid.phone) {
    const existingPhone = await prisma.customers.findUnique({
      where: { phone: valid.phone },
    });
    if (existingPhone && existingPhone.id !== id) {
      throw new DuplicateCustomerError('phone', 'Pelanggan dengan nomor telepon tersebut sudah terdaftar.');
    }
  }

  return prisma.customers.update({
    where: { id },
    data: {
      ...(valid.name && { name: valid.name }),
      ...(valid.email && { email: valid.email }),
      ...(valid.phone && { phone: valid.phone }),
      ...(valid.address !== undefined && { address: valid.address }),
      updated_at: new Date(),
    },
  });
}

export async function deleteCustomer(id: string) {
  await getCustomerById(id);

  // Cek relasi transaksi
  const [quotationCount, invoiceCount] = await Promise.all([
    prisma.quotations.count({ where: { customer_id: id } }),
    prisma.invoices.count({ where: { customer_id: id } }),
  ]);

  if (quotationCount > 0 || invoiceCount > 0) {
    throw new CustomerHasTransactionsError(
      'Pelanggan tidak dapat dihapus karena memiliki riwayat transaksi penawaran atau tagihan aktif.'
    );
  }

  return prisma.customers.delete({
    where: { id },
  });
}
