import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';

describe('Prisma Client & Database Model Integrity', () => {
  it('harus berhasil menginisialisasi Prisma Client singleton', () => {
    assert.ok(prisma, 'Prisma client singleton harus terdefinisi');
  });

  it('harus memiliki model relasi inti yang lengkap (customers, quotations, invoices, products_services)', () => {
    assert.ok(typeof prisma.customers?.findMany === 'function', 'Model customers harus tersedia');
    assert.ok(typeof prisma.quotations?.findMany === 'function', 'Model quotations harus tersedia');
    assert.ok(typeof prisma.invoices?.findMany === 'function', 'Model invoices harus tersedia');
    assert.ok(typeof prisma.products_services?.findMany === 'function', 'Model products_services harus tersedia');
    assert.ok(typeof prisma.document_sequences?.findMany === 'function', 'Model document_sequences harus tersedia');
    assert.ok(typeof prisma.tax_rates?.findMany === 'function', 'Model tax_rates harus tersedia');
  });
});
