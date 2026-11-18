-- ============================================================
-- Migration PRO-305: Tabel Fallback Profil Partner M3
-- ============================================================

CREATE TABLE IF NOT EXISTS public.partner_profiles (
  partner_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tipe_usaha character varying(20) NOT NULL CHECK (
    tipe_usaha::text = ANY (ARRAY['produk'::character varying, 'jasa'::character varying]::text[])
  ),
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partner_profiles_pkey PRIMARY KEY (partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON public.partner_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_is_verified ON public.partner_profiles (is_verified);

-- Pastikan partner_id existing di tabel transaksi sudah terdata di partner_profiles sebelum mengaktifkan FK
INSERT INTO public.partner_profiles (partner_id, user_id, tipe_usaha, is_verified)
SELECT DISTINCT src.partner_id, gen_random_uuid(), 'jasa', true
FROM (
  SELECT partner_id FROM public.products_services
  UNION
  SELECT partner_id FROM public.quotations
  UNION
  SELECT partner_id FROM public.orders
  UNION
  SELECT partner_id FROM public.invoices
) AS src
WHERE NOT EXISTS (
  SELECT 1 FROM public.partner_profiles p WHERE p.partner_id = src.partner_id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_services_partner'
  ) THEN
    ALTER TABLE public.products_services
      ADD CONSTRAINT fk_products_services_partner
      FOREIGN KEY (partner_id) REFERENCES public.partner_profiles(partner_id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotations_partner'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT fk_quotations_partner
      FOREIGN KEY (partner_id) REFERENCES public.partner_profiles(partner_id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_partner'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT fk_orders_partner
      FOREIGN KEY (partner_id) REFERENCES public.partner_profiles(partner_id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_partner'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT fk_invoices_partner
      FOREIGN KEY (partner_id) REFERENCES public.partner_profiles(partner_id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_services_partner_id ON public.products_services (partner_id);
CREATE INDEX IF NOT EXISTS idx_quotations_partner_id ON public.quotations (partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON public.orders (partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON public.invoices (partner_id);
