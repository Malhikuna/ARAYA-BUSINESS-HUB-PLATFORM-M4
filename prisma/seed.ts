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
      price: 750000.0,
      partner_id: DEFAULT_PARTNER_ID,
      tax_rate_id: ppn11.id,
      is_active: true,
    },
    {
      sku: 'AST-ROOM-003',
      name: 'Sewa Ruangan / Aset BPU',
      description: 'Penyewaan ruang pertemuan dan fasilitas unit usaha BPU',
      type: 'SERVICE',
      price: 2000000.0,
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

  console.log('\n🎉 Seeding selesai dengan sukses!');
}

main()
  .catch((err) => {
    console.error('❌ Gagal menjalankan seeder:', err);
    process.exit(1);
  });
