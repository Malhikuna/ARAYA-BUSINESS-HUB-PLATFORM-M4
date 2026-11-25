import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../src/lib/prisma';
import { assertLocalDockerDatabaseUrl } from '../../prisma/seed';

describe('Prisma Client & Database Model Integrity (PRO-305)', () => {
  it('harus berhasil menginisialisasi Prisma Client singleton', () => {
    assert.ok(prisma, 'Prisma client singleton harus terdefinisi');
  });

  it('harus memiliki model relasi inti yang lengkap termasuk partner_profiles (PRO-305), service_requests (PRO-302), serta payments dan webhook_events (PRO-56)', () => {
    assert.ok(typeof prisma.partner_profiles?.findMany === 'function', 'Model partner_profiles harus tersedia');
    assert.ok(typeof prisma.service_requests?.findMany === 'function', 'Model service_requests harus tersedia');
    assert.ok(typeof prisma.payments?.findMany === 'function', 'Model payments harus tersedia');
    assert.ok(typeof prisma.webhook_events?.findMany === 'function', 'Model webhook_events harus tersedia');
    assert.ok(typeof prisma.customers?.findMany === 'function', 'Model customers harus tersedia');
    assert.ok(typeof prisma.quotations?.findMany === 'function', 'Model quotations harus tersedia');
    assert.ok(typeof prisma.invoices?.findMany === 'function', 'Model invoices harus tersedia');
    assert.ok(typeof prisma.products_services?.findMany === 'function', 'Model products_services harus tersedia');
    assert.ok(typeof prisma.document_sequences?.findMany === 'function', 'Model document_sequences harus tersedia');
    assert.ok(typeof prisma.tax_rates?.findMany === 'function', 'Model tax_rates harus tersedia');
  });

  it('harus meloloskan guardrail seeder hanya untuk Docker PostgreSQL lokal port 5433 dan menolak Supabase', () => {
    const validLocalUrl = 'postgresql://araya:araya_local_dev_only@localhost:5433/araya_business_hub';
    assert.equal(assertLocalDockerDatabaseUrl(validLocalUrl), validLocalUrl);

    assert.throws(
      () =>
        assertLocalDockerDatabaseUrl(
          'postgresql://postgres.ref:secret@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
        ),
      /DILARANG KERAS menjalankan seeder dev/
    );

    assert.throws(
      () => assertLocalDockerDatabaseUrl('postgresql://postgres:postgres@localhost:5432/postgres'),
      /DILARANG KERAS menjalankan seeder dev/
    );
  });
});

