-- ============================================================
-- Migration PRO-302:
-- 1. Buat Tabel public.service_requests
-- 2. Update Tabel public.customers (tambah kolom user_id + index)
-- 3. Update Tabel public.quotations (tambah service_request_id UNIQUE FK,
--    sent_at, approved_at, serta selaraskan status ke draf | terkirim | disetujui)
-- ============================================================

-- 1. Buat Tabel public.service_requests
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  customer_id uuid,
  customer_user_id uuid,
  customer_name character varying(150) NOT NULL,
  customer_email character varying(255) NOT NULL,
  customer_phone character varying(20) NOT NULL,
  title character varying(200) NOT NULL,
  description text,
  status character varying(30) NOT NULL DEFAULT 'baru'::character varying CHECK (
    status::text = ANY (ARRAY['baru'::character varying, 'sudah_ditawarkan'::character varying]::text[])
  ),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_requests_pkey PRIMARY KEY (id),
  CONSTRAINT fk_service_requests_partner FOREIGN KEY (partner_id)
    REFERENCES public.partner_profiles(partner_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_service_requests_customer FOREIGN KEY (customer_id)
    REFERENCES public.customers(id) ON UPDATE NO ACTION ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_service_requests_partner_id ON public.service_requests (partner_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_user_id ON public.service_requests (customer_user_id);

-- 2. Update Tabel public.customers: tambah user_id M1 (nullable indexed)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers (user_id);

-- 3. Update Tabel public.quotations:
--    tambah service_request_id (nullable unique FK anti-duplikat), sent_at, approved_at,
--    dan selaraskan status ke 'draf', 'terkirim', 'disetujui' (tetap kompatibel dengan kode lama)
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS service_request_id uuid,
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_quotations_service_request_id'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT uq_quotations_service_request_id UNIQUE (service_request_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotations_service_request'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT fk_quotations_service_request
      FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

-- Perbarui CHECK constraint status pada public.quotations agar mendukung draf | terkirim | disetujui
ALTER TABLE public.quotations DROP CONSTRAINT IF EXISTS quotations_status_check;

ALTER TABLE public.quotations
  ALTER COLUMN status SET DEFAULT 'draf'::character varying;

ALTER TABLE public.quotations
  ADD CONSTRAINT quotations_status_check CHECK (
    status::text = ANY (
      ARRAY[
        'draf'::character varying,
        'terkirim'::character varying,
        'disetujui'::character varying,
        'DRAFT'::character varying,
        'PENDING_APPROVAL'::character varying,
        'APPROVED'::character varying,
        'REJECTED'::character varying
      ]::text[]
    )
  );
