import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { SEED_CUSTOMERS } from './seed-data/customers.data';
import { SEED_PRODUCTS } from './seed-data/products.data';
import { SEED_QUOTATION_TEMPLATES, SEED_ORDER_TEMPLATES } from './seed-data/transactions.data';

const DEFAULT_PARTNER_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('🌱 Memulai proses seeding komprehensif 1 tahun Modul 4 (BPU Unpas)...');

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
    const cust = await prisma.customers.upsert({
      where: { email: c.email },
      update: { name: c.name, phone: c.phone, address: c.address },
      create: c,
    });
    customerMap.set(c.email, cust.id);
  }
  console.log(`   ✅ ${customerMap.size} Customer aktif disinkronkan`);

  // 3. Products & Services
  console.log('3. Menyinkronkan Products & Services...');
  const productMap = new Map<string, any>();
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

  const toItemPayload = (items: any[]) => items.map((it) => ({
    product_service_id: it.product_service_id,
    description: it.description || null,
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
  const quoteMap = new Map<string, any>();
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
  const orderMap = new Map<string, any>();
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

main()
  .catch((err) => {
    console.error('❌ Gagal menjalankan seeder:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
