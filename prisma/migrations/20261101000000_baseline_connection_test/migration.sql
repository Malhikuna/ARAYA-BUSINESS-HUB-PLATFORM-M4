-- Migration uji koneksi ke Supabase (SEMENTARA).
-- Hapus folder migration ini (beserta ikhtisar _prisma_migrations-nya)
-- setelah struktur tabel asli project sudah di-baseline.
CREATE TABLE "connection_test" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "checked_at" timestamptz(3) NOT NULL DEFAULT now()
);
