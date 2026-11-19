import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  datasource: {
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DATABASE_URL ||
      'postgresql://araya:araya_local_dev_only@localhost:5433/araya_business_hub',
  },
});

