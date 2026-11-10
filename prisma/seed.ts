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
    { document_type: 'QUOTATION', period: currentPeriod, last_number: BigInt(10) },
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
  const custMurdo = await prisma.customers.findFirst({ where: { name: 'PT Murdo Adipate' } });

  const prodKonsul = await prisma.products_services.findFirst({ where: { sku: 'SRV-CONS-001' } });
  const prodDesain = await prisma.products_services.findFirst({ where: { sku: 'SRV-DSGN-002' } });
  const prodLaptop = await prisma.products_services.findFirst({ where: { sku: 'PRD-LPT-001' } });
  const prodServer = await prisma.products_services.findFirst({ where: { sku: 'PRD-SRV-002' } });

  if (custMaju && custKarya && custDudi && prodKonsul && prodDesain && prodLaptop) {
    const defaultCustId = custMurdo ? custMurdo.id : custMaju.id;
    const defaultServerId = prodServer ? prodServer.id : prodLaptop.id;

    // 10 Data penawaran resmi: 5 PENDING_APPROVAL (top) dan 5 APPROVED (bottom)
    const dummyQuotations = [
      { num: 'PNW-0010', cust: custMaju.id, date: '2026-11-09', valid: '2026-11-23', st: 'PENDING_APPROVAL', total: 3000000, notes: 'Evaluasi efisiensi operasional akhir tahun.', items: [{ pId: prodKonsul.id, desc: 'Paket konsultasi bisnis', qty: 2, price: 1500000 }] },
      { num: 'PNW-0009', cust: custKarya.id, date: '2026-11-08', valid: '2026-11-22', st: 'PENDING_APPROVAL', total: 8900000, notes: 'Pengadaan laptop teknis divisi implementasi.', items: [{ pId: prodLaptop.id, desc: 'Laptop kantor 14 inci', qty: 1, price: 8900000 }] },
      { num: 'PNW-0008', cust: custDudi.id, date: '2026-11-07', valid: '2026-11-21', st: 'PENDING_APPROVAL', total: 750000, notes: 'Aset visual logo digital dan panduan grafis.', items: [{ pId: prodDesain.id, desc: 'Jasa desain logo', qty: 1, price: 750000 }] },
      { num: 'PNW-0007', cust: defaultCustId, date: '2026-11-06', valid: '2026-11-20', st: 'PENDING_APPROVAL', total: 16500000, notes: 'Pengadaan server rackmount internal basis data.', items: [{ pId: defaultServerId, desc: 'Server Rack Mount 1U', qty: 1, price: 16500000 }] },
      { num: 'PNW-0006', cust: custMaju.id, date: '2026-11-05', valid: '2026-11-19', st: 'PENDING_APPROVAL', total: 2250000, notes: 'Layanan konsultasi dan perancangan logo.', items: [{ pId: prodKonsul.id, desc: 'Paket konsultasi bisnis', qty: 1, price: 1500000 }, { pId: prodDesain.id, desc: 'Jasa desain logo', qty: 1, price: 750000 }] },
      { num: 'PNW-0005', cust: custKarya.id, date: '2026-11-04', valid: '2026-11-18', st: 'APPROVED', total: 16500000, notes: 'Perangkat server disetujui instalasi.', items: [{ pId: defaultServerId, desc: 'Server Rack Mount 1U', qty: 1, price: 16500000 }] },
      { num: 'PNW-0004', cust: custDudi.id, date: '2026-11-03', valid: '2026-11-17', st: 'APPROVED', total: 8900000, notes: 'Laptop disetujui Core i5 16GB.', items: [{ pId: prodLaptop.id, desc: 'Laptop kantor 14 inci', qty: 1, price: 8900000 }] },
      { num: 'PNW-0003', cust: defaultCustId, date: '2026-11-02', valid: '2026-11-16', st: 'APPROVED', total: 1500000, notes: 'Konsultasi roadmap sistem disetujui direksi.', items: [{ pId: prodKonsul.id, desc: 'Paket konsultasi bisnis', qty: 1, price: 1500000 }] },
      { num: 'PNW-0002', cust: custMaju.id, date: '2026-11-01', valid: '2026-11-15', st: 'APPROVED', total: 750000, notes: 'Desain logo korporat siap produksi.', items: [{ pId: prodDesain.id, desc: 'Jasa desain logo', qty: 1, price: 750000 }] },
      { num: 'PNW-0001', cust: custKarya.id, date: '2026-10-30', valid: '2026-11-13', st: 'APPROVED', total: 3000000, notes: 'Pendampingan bisnis dan pelaporan triwulan.', items: [{ pId: prodKonsul.id, desc: 'Paket konsultasi bisnis', qty: 2, price: 1500000 }] },
    ];

    for (const q of dummyQuotations) {
      const existing = await prisma.quotations.findUnique({
        where: { quotation_number: q.num },
      });

      if (!existing) {
        const created = await prisma.quotations.create({
          data: {
            quotation_number: q.num,
            customer_id: q.cust,
            partner_id: DEFAULT_PARTNER_ID,
            quotation_date: new Date(`${q.date}T00:00:00.000Z`),
            valid_until: new Date(`${q.valid}T00:00:00.000Z`),
            status: q.st,
            subtotal: q.total,
            discount_amount: 0,
            tax_amount: 0,
            total_amount: q.total,
            notes: q.notes,
            created_at: new Date(`${q.date}T08:00:00.000Z`),
            quotation_items: {
              create: q.items.map((it) => ({
                product_service_id: it.pId,
                description: it.desc,
                quantity: it.qty,
                unit_price: it.price,
                subtotal: it.qty * it.price,
                total_amount: it.qty * it.price,
              })),
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
