import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import type { Prisma } from '../generated/prisma/client';
import { SEED_CUSTOMERS } from './seed-data/customers.data';
import { SEED_PRODUCTS } from './seed-data/products.data';
import { SEED_QUOTATION_TEMPLATES, SEED_ORDER_TEMPLATES } from './seed-data/transactions.data';

const DEFAULT_PARTNER_ID = '00000000-0000-0000-0000-000000000001';
export const PARTNER_JASA_ID = DEFAULT_PARTNER_ID;
export const PARTNER_PRODUK_ID = '00000000-0000-0000-0000-000000000002';
export const PARTNER_UNVERIFIED_ID = '00000000-0000-0000-0000-000000000003';

export const USER_PARTNER_JASA_ID = '10000000-0000-0000-0000-000000000001';
export const USER_PARTNER_PRODUK_ID = '10000000-0000-0000-0000-000000000002';
export const USER_PARTNER_UNVERIFIED_ID = '10000000-0000-0000-0000-000000000003';
export const CUSTOMER_M1_USER_ID = '20000000-0000-0000-0000-000000000017';
export const SERVICE_REQUEST_BARU_ID = '30000000-0000-0000-0000-000000000001';
export const SERVICE_REQUEST_QUOTED_ID = '30000000-0000-0000-0000-000000000002';

/**
 * Guardrail Lingkungan (PRO-305):
 * Seeder dev HANYA boleh dijalankan ke Docker PostgreSQL lokal port 5433.
 * Dilarang keras dijalankan ke Supabase Production / remote host.
 */
export function assertLocalDockerDatabaseUrl(connectionUrl: string | undefined): string {
  if (!connectionUrl) {
    throw new Error(
      '[PRO-305 GUARDRAIL] DATABASE_URL tidak ditemukan. Seeder hanya boleh dijalankan ke Docker lokal port 5433.'
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionUrl);
  } catch {
    throw new Error('[PRO-305 GUARDRAIL] Format DATABASE_URL tidak valid.');
  }

  const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  const isPort5433 = parsed.port === '5433';
  const isSupabase = parsed.hostname.toLowerCase().includes('supabase');

  if (isSupabase || !isLocalHost || !isPort5433) {
    throw new Error(
      `[PRO-305 GUARDRAIL] DILARANG KERAS menjalankan seeder dev ke '${parsed.hostname}:${parsed.port || '5432'}'! ` +
        'Seeder ini khusus untuk Docker PostgreSQL lokal (localhost:5433 / 127.0.0.1:5433).'
    );
  }

  return connectionUrl;
}

type SeededQuotation = Prisma.quotationsGetPayload<{
  include: { quotation_items: true; invoices: true };
}>;
type SeededOrder = Prisma.ordersGetPayload<{
  include: { order_items: true; invoices: true };
}>;

async function main() {
  const activeUrl =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    'postgresql://araya:araya_local_dev_only@localhost:5433/araya_business_hub';

  assertLocalDockerDatabaseUrl(activeUrl);

  console.log('🌱 Memulai proses seeding komprehensif 1 tahun Modul 4 (BPU Unpas) [Target: Docker localhost:5433]...');

  // 0. Partner Profiles M3 Fallback (PRO-305)
  console.log('0. Menyinkronkan Partner Profiles M3 (partner_profiles)...');
  const partnerSamples = [
    {
      partner_id: PARTNER_JASA_ID,
      user_id: USER_PARTNER_JASA_ID,
      tipe_usaha: 'jasa',
      is_verified: true,
    },
    {
      partner_id: PARTNER_PRODUK_ID,
      user_id: USER_PARTNER_PRODUK_ID,
      tipe_usaha: 'produk',
      is_verified: true,
    },
    {
      partner_id: PARTNER_UNVERIFIED_ID,
      user_id: USER_PARTNER_UNVERIFIED_ID,
      tipe_usaha: 'produk',
      is_verified: false,
    },
  ];

  for (const partner of partnerSamples) {
    await prisma.partner_profiles.upsert({
      where: { partner_id: partner.partner_id },
      update: {
        user_id: partner.user_id,
        tipe_usaha: partner.tipe_usaha,
        is_verified: partner.is_verified,
        updated_at: new Date(),
      },
      create: partner,
    });
  }
  console.log(`   ✅ ${partnerSamples.length} Partner Profile fallback M3 disinkronkan`);

  // 1. Tax Rates
  console.log('1. Menyinkronkan Tax Rate...');
  let ppn11 = await prisma.tax_rates.findFirst({ where: { name: 'PPN 11%' } });
  if (!ppn11) {
    ppn11 = await prisma.tax_rates.create({
      data: { name: 'PPN 11%', rate: 11.0, description: 'Pajak Pertambahan Nilai 11% resmi', is_active: true },
    });
  }

  // 2. Customers
  console.log('2. Menyinkronkan Customers...');
  const customerMap = new Map<string, string>();
  for (const c of SEED_CUSTOMERS) {
    const userId = c.email === 'dudi.santoso@gmail.com' ? CUSTOMER_M1_USER_ID : null;
    const cust = await prisma.customers.upsert({
      where: { email: c.email },
      update: { name: c.name, phone: c.phone, address: c.address, user_id: userId },
      create: { ...c, user_id: userId },
    });
    customerMap.set(c.email, cust.id);
  }
  console.log(`   ✅ ${customerMap.size} Customer aktif disinkronkan`);

  // 2b. Service Requests dari M5 (PRO-302 & PRO-305)
  console.log('2b. Menyinkronkan Service Requests M5 (service_requests)...');
  const dudiCustomerId = customerMap.get('dudi.santoso@gmail.com') || null;
  const serviceRequestsSeed = [
    {
      id: SERVICE_REQUEST_BARU_ID,
      partner_id: PARTNER_JASA_ID,
      customer_id: dudiCustomerId,
      customer_user_id: CUSTOMER_M1_USER_ID,
      customer_name: 'Dudi Santoso',
      customer_email: 'dudi.santoso@gmail.com',
      customer_phone: '081711223344',
      title: 'Permintaan Konsultasi Transformasi Digital UMKM',
      description: 'Mohon penawaran pendampingan digitalisasi operasional selama 1 kuartal.',
      status: 'baru',
    },
    {
      id: SERVICE_REQUEST_QUOTED_ID,
      partner_id: PARTNER_JASA_ID,
      customer_id: dudiCustomerId,
      customer_user_id: CUSTOMER_M1_USER_ID,
      customer_name: 'Dudi Santoso',
      customer_email: 'dudi.santoso@gmail.com',
      customer_phone: '081711223344',
      title: 'Permintaan Audit Keamanan Sistem Internal',
      description: 'Permintaan jasa audit kesiapan keamanan aplikasi sebelum rilis produksi.',
      status: 'sudah_ditawarkan',
    },
  ];

  for (const sr of serviceRequestsSeed) {
    await prisma.service_requests.upsert({
      where: { id: sr.id },
      update: {
        partner_id: sr.partner_id,
        customer_id: sr.customer_id,
        customer_user_id: sr.customer_user_id,
        customer_name: sr.customer_name,
        customer_email: sr.customer_email,
        customer_phone: sr.customer_phone,
        title: sr.title,
        description: sr.description,
        status: sr.status,
        updated_at: new Date(),
      },
      create: sr,
    });
  }
  console.log(`   ✅ ${serviceRequestsSeed.length} Permintaan Jasa M5 disinkronkan`);

  // 3. Products & Services
  console.log('3. Menyinkronkan Products & Services...');
  const productMap = new Map<string, Prisma.products_servicesModel>();
  for (const p of SEED_PRODUCTS) {
    const prod = await prisma.products_services.upsert({
      where: { sku: p.sku },
      update: { name: p.name, description: p.description, price: p.price, stock: p.stock },
      create: { ...p, partner_id: DEFAULT_PARTNER_ID, tax_rate_id: ppn11.id, is_active: true },
    });
    productMap.set(p.sku, prod);
  }
  console.log(`   ✅ ${productMap.size} Produk/Jasa aktif disinkronkan`);

  const calcItem = (price: number, qty: number, disc = 0, taxRate = 11) => {
    const subtotal = price * qty;
    const net = subtotal - disc;
    const tax = Math.round(net * (taxRate / 100));
    return { unit_price: price, quantity: qty, discount_amount: disc, tax_rate: taxRate, subtotal, tax_amount: tax, total_amount: net + tax };
  };

  const toItemPayload = (items: Array<Prisma.quotation_itemsModel | Prisma.order_itemsModel>) => items.map((it) => ({
    product_service_id: it.product_service_id,
    description: 'description' in it ? it.description || null : null,
    quantity: it.quantity,
    unit_price: it.unit_price,
    discount_amount: it.discount_amount,
    tax_rate: it.tax_rate,
    tax_amount: it.tax_amount,
    subtotal: it.subtotal,
    total_amount: it.total_amount,
  }));

  const now = Date.now();
  const DAY_MS = 86400000;

  // 4. Quotations
  console.log('4. Menyinkronkan Quotations...');
  const quoteMap = new Map<string, SeededQuotation>();
  for (const q of SEED_QUOTATION_TEMPLATES) {
    const custId = customerMap.get(q.customerEmail);
    const prod = productMap.get(q.sku);
    if (!custId || !prod) continue;

    let quote = await prisma.quotations.findUnique({
      where: { quotation_number: q.number },
      include: { quotation_items: true, invoices: true },
    });

    if (!quote) {
      const itm = calcItem(Number(prod.price), q.quantity);
      const qDate = new Date(now - q.daysAgo * DAY_MS);
      const vDate = new Date(qDate.getTime() + q.validDays * DAY_MS);

      quote = await prisma.quotations.create({
        data: {
          quotation_number: q.number,
          customer_id: custId,
          partner_id: DEFAULT_PARTNER_ID,
          quotation_date: qDate,
          valid_until: vDate,
          status: q.status,
          notes: q.notes,
          subtotal: itm.subtotal,
          discount_amount: 0,
          tax_amount: itm.tax_amount,
          total_amount: itm.total_amount,
          created_at: qDate,
          updated_at: qDate,
          quotation_items: { create: [{ product_service_id: prod.id, description: prod.name, ...itm, created_at: qDate }] },
        },
        include: { quotation_items: true, invoices: true },
      });
    }
    quoteMap.set(q.number, quote);
  }
  console.log(`   ✅ ${quoteMap.size} Quotation historis & terkini disinkronkan`);

  // 5. Orders (M5 E-Commerce)
  console.log('5. Menyinkronkan Orders...');
  const orderMap = new Map<string, SeededOrder>();
  for (const o of SEED_ORDER_TEMPLATES) {
    const custId = customerMap.get(o.customerEmail);
    const prod = productMap.get(o.sku);
    if (!custId || !prod) continue;

    let order = await prisma.orders.findUnique({
      where: { order_number: o.number },
      include: { order_items: true, invoices: true },
    });

    if (!order) {
      const itm = calcItem(Number(prod.price), o.quantity);
      const oDate = new Date(now - o.daysAgo * DAY_MS);
      order = await prisma.orders.create({
        data: {
          order_number: o.number,
          customer_id: custId,
          partner_id: DEFAULT_PARTNER_ID,
          status: o.status,
          subtotal: itm.subtotal,
          discount_amount: 0,
          tax_amount: itm.tax_amount,
          total_amount: itm.total_amount,
          created_at: oDate,
          status_updated_at: oDate,
          order_items: { create: [{ product_service_id: prod.id, ...itm, created_at: oDate }] },
        },
        include: { order_items: true, invoices: true },
      });
    }
    orderMap.set(o.number, order);
  }
  console.log(`   ✅ ${orderMap.size} Order e-commerce disinkronkan`);

  // 6. Invoices
  console.log('6. Menyinkronkan Invoices...');
  // 6a. Invoices dari Quotation (Approved)
  const quoteInvoices = [
    { num: 'INV-202601-0001', qNum: 'PNW-202601-0001', status: 'PAID', daysAgo: 305, method: 'Midtrans - Bank Transfer (Mandiri)' },
    { num: 'INV-202602-0002', qNum: 'PNW-202602-0002', status: 'PAID', daysAgo: 270, method: 'Midtrans - Virtual Account (BJB)' },
    { num: 'INV-202603-0003', qNum: 'PNW-202603-0003', status: 'PAID', daysAgo: 240, method: 'Midtrans - Bank Transfer (BCA)' },
    { num: 'INV-202607-0004', qNum: 'PNW-202607-0005', status: 'PAID', daysAgo: 125, method: 'Midtrans - Virtual Account (BJB)' },
    { num: 'INV-202608-0005', qNum: 'PNW-202608-0006', status: 'PAID', daysAgo: 92, method: 'Midtrans - QRIS' },
    { num: 'INV-202609-0006', qNum: 'PNW-202609-0007', status: 'UNPAID', daysAgo: 5, method: null },
  ];

  for (const inv of quoteInvoices) {
    const q = quoteMap.get(inv.qNum);
    if (!q || (await prisma.invoices.findUnique({ where: { invoice_number: inv.num } }))) continue;
    const invDate = new Date(now - inv.daysAgo * DAY_MS);
    const dueDate = new Date(invDate.getTime() + 14 * DAY_MS);
    const paidAt = inv.status === 'PAID' ? new Date(invDate.getTime() + 2 * DAY_MS) : null;

    await prisma.invoices.create({
      data: {
        invoice_number: inv.num,
        quotation_id: q.id,
        customer_id: q.customer_id,
        partner_id: q.partner_id,
        invoice_date: invDate,
        due_date: dueDate,
        status: inv.status,
        paid_at: paidAt,
        payment_method: inv.method,
        subtotal: q.subtotal,
        discount_amount: q.discount_amount,
        tax_amount: q.tax_amount,
        total_amount: q.total_amount,
        created_at: invDate,
        updated_at: paidAt || invDate,
        invoice_items: { create: toItemPayload(q.quotation_items) },
      },
    });
  }

  // 6b. Invoices dari Order Checkout (M5)
  const orderInvoices = [
    { num: 'INV-202602-0101', oNum: 'ORD-202602-0001', status: 'PAID', daysAgo: 269, method: 'Midtrans - GoPay' },
    { num: 'INV-202604-0102', oNum: 'ORD-202604-0002', status: 'PAID', daysAgo: 209, method: 'Midtrans - ShopeePay' },
    { num: 'INV-202606-0103', oNum: 'ORD-202606-0003', status: 'PAID', daysAgo: 159, method: 'Midtrans - Virtual Account (BCA)' },
    { num: 'INV-202608-0104', oNum: 'ORD-202608-0004', status: 'PAID', daysAgo: 89, method: 'Midtrans - QRIS' },
    { num: 'INV-202610-0105', oNum: 'ORD-202610-0005', status: 'PAID', daysAgo: 34, method: 'Midtrans - Virtual Account (Mandiri)' },
    { num: 'INV-202611-0106', oNum: 'ORD-202611-0006', status: 'PAID', daysAgo: 3, method: 'Midtrans - QRIS' },
    { num: 'INV-202611-0107', oNum: 'ORD-202611-0007', status: 'UNPAID', daysAgo: 1, method: null },
    { num: 'INV-202611-0108', oNum: 'ORD-202611-0008', status: 'UNPAID', daysAgo: 0, method: null },
  ];

  for (const inv of orderInvoices) {
    const o = orderMap.get(inv.oNum);
    if (!o || (await prisma.invoices.findUnique({ where: { invoice_number: inv.num } }))) continue;
    const invDate = new Date(now - inv.daysAgo * DAY_MS);
    const dueDate = new Date(invDate.getTime() + 7 * DAY_MS);
    const paidAt = inv.status === 'PAID' ? new Date(invDate.getTime() + 3600000) : null;

    await prisma.invoices.create({
      data: {
        invoice_number: inv.num,
        order_id: o.id,
        customer_id: o.customer_id,
        partner_id: o.partner_id,
        invoice_date: invDate,
        due_date: dueDate,
        status: inv.status,
        paid_at: paidAt,
        payment_method: inv.method,
        subtotal: o.subtotal,
        discount_amount: o.discount_amount,
        tax_amount: o.tax_amount,
        total_amount: o.total_amount,
        created_at: invDate,
        updated_at: paidAt || invDate,
        invoice_items: { create: toItemPayload(o.order_items) },
      },
    });
  }
  console.log('   ✅ 14 Invoice (6 Quotation + 8 Order) disinkronkan');

  // 6c. Payments & Webhook Events (PRO-56 / M4-US3)
  console.log('6c. Menyinkronkan Payments & Webhook Events (payments & webhook_events)...');
  const seededInvoices = await prisma.invoices.findMany({
    where: {
      invoice_number: {
        in: ['INV-202601-0001', 'INV-202609-0006', 'INV-202611-0106', 'INV-202611-0107'],
      },
    },
  });

  for (const inv of seededInvoices) {
    const isPaid = inv.status === 'PAID' || inv.status === 'lunas';
    const midtransOrderId = `${inv.invoice_number}-S1`;
    const txId = `mid-tx-${inv.invoice_number.toLowerCase()}`;
    const paymentStatus = isPaid ? 'settlement' : 'pending';
    const paymentType = isPaid ? inv.payment_method || 'qris' : 'qris';
    const grossAmountStr = Number(inv.total_amount).toFixed(2);

    const payment = await prisma.payments.upsert({
      where: { midtrans_order_id: midtransOrderId },
      update: {
        status: paymentStatus,
        fraud_status: isPaid ? 'accept' : null,
        payment_type: paymentType,
        paid_at: inv.paid_at,
        updated_at: new Date(),
      },
      create: {
        invoice_id: inv.id,
        provider: 'midtrans',
        midtrans_order_id: midtransOrderId,
        transaction_id: txId,
        amount: inv.total_amount,
        status: paymentStatus,
        fraud_status: isPaid ? 'accept' : null,
        payment_type: paymentType,
        snap_token: `snap-dev-${inv.invoice_number.toLowerCase()}`,
        redirect_url: `https://app.sandbox.midtrans.com/snap/v4/redirection/snap-dev-${inv.invoice_number.toLowerCase()}`,
        paid_at: inv.paid_at,
      },
    });

    if (isPaid) {
      const eventKey = `${txId}:settlement`;
      await prisma.webhook_events.upsert({
        where: { event_key: eventKey },
        update: {
          processing_status: 'processed',
          signature_valid: true,
        },
        create: {
          event_key: eventKey,
          provider: 'midtrans',
          invoice_id: inv.id,
          payment_id: payment.id,
          midtrans_order_id: midtransOrderId,
          transaction_id: txId,
          transaction_status: 'settlement',
          fraud_status: 'accept',
          status_code: '200',
          gross_amount: grossAmountStr,
          payment_type: paymentType,
          signature_key: '0'.repeat(128),
          signature_valid: true,
          processing_status: 'processed',
          raw_payload: {
            transaction_id: txId,
            order_id: midtransOrderId,
            transaction_status: 'settlement',
            fraud_status: 'accept',
            status_code: '200',
            gross_amount: grossAmountStr,
            payment_type: paymentType,
          },
          processed_at: inv.paid_at || new Date(),
        },
      });
    }
  }
  console.log(`   ✅ ${seededInvoices.length} Sesi Payment & Log Webhook Event disinkronkan`);

  // 7. Document Sequences
  console.log('7. Menyinkronkan Document Sequences...');
  const currentPeriod = new Date().toISOString().slice(0, 7).replace('-', '');
  const seqDefs = [
    { type: 'QUOTATION', period: currentPeriod, last: BigInt(30) },
    { type: 'INVOICE', period: currentPeriod, last: BigInt(15) },
    { type: 'ORDER', period: currentPeriod, last: BigInt(15) },
  ];

  for (const s of seqDefs) {
    await prisma.document_sequences.upsert({
      where: { document_type_period: { document_type: s.type, period: s.period } },
      update: { last_number: s.last },
      create: { document_type: s.type, period: s.period, last_number: s.last },
    });
  }
  console.log('   ✅ Document Sequences disinkronkan');

  console.log('\n🎉 Seeding komprehensif 1 tahun operasional selesai!');
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('prisma/seed.ts');

if (isDirectExecution) {
  main()
    .catch((err) => {
      console.error('❌ Gagal menjalankan seeder:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

