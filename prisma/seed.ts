import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

const DEFAULT_PARTNER_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('🌱 Memulai proses seeding data awal Modul 4...');

  // 1. Seed Tax Rates
  console.log('1. Seeding Tax Rates (PPN 11%)...');
  let ppn11 = await prisma.tax_rates.findFirst({
    where: { name: 'PPN 11%' },
  });

  if (!ppn11) {
    ppn11 = await prisma.tax_rates.create({
      data: {
        name: 'PPN 11%',
        rate: 11.0,
        description: 'Pajak Pertambahan Nilai 11% standar resmi',
        is_active: true,
      },
    });
    console.log('   ✅ Tax rate PPN 11% berhasil dibuat:', ppn11.id);
  } else {
    console.log('   ℹ️ Tax rate PPN 11% sudah ada:', ppn11.id);
  }

  // 2. Seed Customers
  console.log('2. Seeding Pelanggan (Customers)...');
  const dummyCustomers = [
    {
      name: 'PT Maju Bersama',
      email: 'procurement@majubersama.co.id',
      phone: '081234567890',
      address: 'Jl. Asia Afrika No. 120, Bandung, Jawa Barat',
    },
    {
      name: 'CV Karya Mandiri',
      email: 'finance@karyamandiri.com',
      phone: '081398765432',
      address: 'Jl. Dago No. 45, Bandung, Jawa Barat',
    },
    {
      name: 'Dudi Santoso',
      email: 'dudi.santoso@gmail.com',
      phone: '081711223344',
      address: 'Jl. Buah Batu No. 88, Bandung, Jawa Barat',
    },
  ];

  for (const cust of dummyCustomers) {
    const existing = await prisma.customers.findUnique({
      where: { email: cust.email },
    });

    if (!existing) {
      const created = await prisma.customers.create({ data: cust });
      console.log(`   ✅ Pelanggan dibuat: ${created.name} (${created.email})`);
    } else {
      console.log(`   ℹ️ Pelanggan sudah ada: ${existing.name}`);
    }
  }

  // 3. Seed Products / Services
  console.log('3. Seeding Produk & Jasa (Products/Services)...');
  const dummyProducts = [
    {
      sku: 'SRV-CONS-001',
      name: 'Paket Konsultasi Bisnis',
      description: 'Pendampingan strategi operasional dan finansial Q4',
      type: 'SERVICE',
      unit: 'Jam',
      stock: 0,
      price: 1500000.0,
      partner_id: DEFAULT_PARTNER_ID,
      tax_rate_id: ppn11.id,
      is_active: true,
    },
    {
      sku: 'SRV-DSGN-002',
      name: 'Jasa Desain Logo',
      description: 'Paket identitas visual korporat lengkap dengan panduan merek',
      type: 'SERVICE',
      unit: 'Paket',
      stock: 0,
      price: 750000.0,
      partner_id: DEFAULT_PARTNER_ID,
      tax_rate_id: ppn11.id,
      is_active: true,
    },
    {
      sku: 'PRD-LPT-001',
      name: 'Laptop Kantor 14 Inci',
      description: 'Perangkat kerja Intel Core i5, RAM 16 GB, SSD 512 GB dengan garansi resmi.',
      type: 'PRODUCT',
      unit: 'Unit',
      stock: 15,
      price: 8900000.0,
      partner_id: DEFAULT_PARTNER_ID,
      tax_rate_id: ppn11.id,
      is_active: true,
    },
    {
      sku: 'PRD-SRV-002',
      name: 'Server Rack Mount 1U',
      description: 'Unit rak server enterprise untuk penyimpanan database internal perusahaan.',
      type: 'PRODUCT',
      unit: 'Unit',
      stock: 4,
      price: 16500000.0,
      partner_id: DEFAULT_PARTNER_ID,
      tax_rate_id: ppn11.id,
      is_active: true,
    },
  ];

  for (const prod of dummyProducts) {
    const existing = await prisma.products_services.findUnique({
      where: { sku: prod.sku },
    });

    if (!existing) {
      const created = await prisma.products_services.create({ data: prod });
      console.log(`   ✅ Produk dibuat: [${created.sku}] ${created.name}`);
    } else {
      console.log(`   ℹ️ Produk sudah ada: [${existing.sku}] ${existing.name}`);
    }
  }

  // 4. Seed Document Sequences
  console.log('4. Seeding Document Sequences...');
  const currentPeriod = new Date().toISOString().slice(0, 7).replace('-', ''); // e.g. "202611"

  const sequences = [
    { document_type: 'QUOTATION', period: currentPeriod, last_number: BigInt(5) },
    { document_type: 'INVOICE', period: currentPeriod, last_number: BigInt(2) },
  ];

  for (const seq of sequences) {
    const existing = await prisma.document_sequences.findUnique({
      where: {
        document_type_period: {
          document_type: seq.document_type,
          period: seq.period,
        },
      },
    });

    if (!existing) {
      await prisma.document_sequences.create({
        data: seq,
      });
      console.log(`   ✅ Sequence dibuat: ${seq.document_type} (Periode: ${seq.period})`);
    } else {
      console.log(`   ℹ️ Sequence sudah ada: ${seq.document_type} (Periode: ${seq.period})`);
    }
  }

  // 5. Seed Initial Quotations
  console.log('5. Seeding Penawaran (Quotations & Quotation Items)...');
  const custMaju = await prisma.customers.findFirst({ where: { name: 'PT Maju Bersama' } });
  const custKarya = await prisma.customers.findFirst({ where: { name: 'CV Karya Mandiri' } });
  const custDudi = await prisma.customers.findFirst({ where: { email: 'dudi.santoso@gmail.com' } });

  const prodKonsul = await prisma.products_services.findFirst({ where: { sku: 'SRV-CONS-001' } });
  const prodDesain = await prisma.products_services.findFirst({ where: { sku: 'SRV-DSGN-002' } });
  const prodLaptop = await prisma.products_services.findFirst({ where: { sku: 'PRD-LPT-001' } });

  if (custMaju && custKarya && custDudi && prodKonsul && prodDesain && prodLaptop) {
    const dummyQuotations = [
      {
        quotation_number: 'PNW-0005',
        customer_id: custMaju.id,
        partner_id: DEFAULT_PARTNER_ID,
        quotation_date: new Date('2026-10-28T00:00:00.000Z'),
        valid_until: new Date('2026-11-11T00:00:00.000Z'),
        status: 'PENDING_APPROVAL',
        subtotal: 3750000,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 3750000,
        notes: 'Penawaran paket pendampingan bisnis dan visual branding.',
        created_at: new Date('2026-10-28T11:02:00.000Z'),
        updated_at: new Date('2026-10-28T14:20:00.000Z'),
        items: [
          { product_service_id: prodKonsul.id, description: 'Paket konsultasi bisnis', quantity: 2, unit_price: 1500000, subtotal: 3000000, total_amount: 3000000 },
          { product_service_id: prodDesain.id, description: 'Jasa desain logo', quantity: 1, unit_price: 750000, subtotal: 750000, total_amount: 750000 },
        ],
      },
      {
        quotation_number: 'PNW-0004',
        customer_id: custKarya.id,
        partner_id: DEFAULT_PARTNER_ID,
        quotation_date: new Date('2026-10-26T00:00:00.000Z'),
        valid_until: new Date('2026-11-09T00:00:00.000Z'),
        status: 'APPROVED',
        subtotal: 8900000,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 8900000,
        notes: 'Pengadaan laptop divisi teknik.',
        created_at: new Date('2026-10-26T10:15:00.000Z'),
        updated_at: new Date('2026-10-26T16:00:00.000Z'),
        items: [
          { product_service_id: prodLaptop.id, description: 'Laptop kantor 14 inci', quantity: 1, unit_price: 8900000, subtotal: 8900000, total_amount: 8900000 },
        ],
      },
      {
        quotation_number: 'PNW-0003',
        customer_id: custDudi.id,
        partner_id: DEFAULT_PARTNER_ID,
        quotation_date: new Date('2026-10-24T00:00:00.000Z'),
        valid_until: new Date('2026-11-07T00:00:00.000Z'),
        status: 'APPROVED',
        subtotal: 750000,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 750000,
        notes: 'Desain identitas brand personal.',
        created_at: new Date('2026-10-24T09:45:00.000Z'),
        updated_at: new Date('2026-10-24T15:30:00.000Z'),
        items: [
          { product_service_id: prodDesain.id, description: 'Jasa desain logo', quantity: 1, unit_price: 750000, subtotal: 750000, total_amount: 750000 },
        ],
      },
      {
        quotation_number: 'PNW-0002',
        customer_id: custMaju.id,
        partner_id: DEFAULT_PARTNER_ID,
        quotation_date: new Date('2026-10-20T00:00:00.000Z'),
        valid_until: new Date('2026-11-03T00:00:00.000Z'),
        status: 'PENDING_APPROVAL',
        subtotal: 1500000,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 1500000,
        notes: 'Sesi konsultasi awal evaluasi.',
        created_at: new Date('2026-10-20T08:00:00.000Z'),
        updated_at: new Date('2026-10-20T11:15:00.000Z'),
        items: [
          { product_service_id: prodKonsul.id, description: 'Paket konsultasi bisnis', quantity: 1, unit_price: 1500000, subtotal: 1500000, total_amount: 1500000 },
        ],
      },
      {
        quotation_number: 'PNW-0001',
        customer_id: custKarya.id,
        partner_id: DEFAULT_PARTNER_ID,
        quotation_date: new Date('2026-10-15T00:00:00.000Z'),
        valid_until: new Date('2026-10-29T00:00:00.000Z'),
        status: 'APPROVED',
        subtotal: 4250000,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 4250000,
        notes: 'Pengadaan perangkat kerja penunjang divisi kreatif.',
        created_at: new Date('2026-10-15T08:30:00.000Z'),
        updated_at: new Date('2026-10-15T17:00:00.000Z'),
        items: [
          { product_service_id: prodKonsul.id, description: 'Paket konsultasi bisnis', quantity: 2, unit_price: 1500000, subtotal: 3000000, total_amount: 3000000 },
          { product_service_id: prodDesain.id, description: 'Jasa desain logo', quantity: 1, unit_price: 750000, subtotal: 750000, total_amount: 750000 },
        ],
      },
    ];

    for (const q of dummyQuotations) {
      const existing = await prisma.quotations.findUnique({
        where: { quotation_number: q.quotation_number },
      });

      if (!existing) {
        const { items, ...quoData } = q;
        const created = await prisma.quotations.create({
          data: {
            ...quoData,
            quotation_items: {
              create: items,
            },
          },
        });
        console.log(`   ✅ Penawaran dibuat: ${created.quotation_number} (${created.status})`);
      } else {
        console.log(`   ℹ️ Penawaran sudah ada: ${existing.quotation_number}`);
      }
    }
  }

  console.log('\n🎉 Seeding selesai dengan sukses!');
}

main()
  .catch((err) => {
    console.error('❌ Gagal menjalankan seeder:', err);
    process.exit(1);
  });
