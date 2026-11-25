-- ============================================================
-- Migration PRO-56 (M4-US3):
-- 1. Buat Tabel public.payments (Sesi & Status Pembayaran Midtrans Snap)
-- 2. Buat Tabel public.webhook_events (Audit Log & Idempotensi Webhook)
-- 3. Selaraskan status pembayaran pada public.invoices & public.payments
-- ============================================================

-- 1. Buat Tabel public.payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  provider character varying(30) NOT NULL DEFAULT 'midtrans'::character varying,
  midtrans_order_id character varying(60) NOT NULL UNIQUE,
  transaction_id character varying(100) UNIQUE,
  amount numeric(15,2) NOT NULL DEFAULT 0 CHECK (amount >= 0::numeric),
  status character varying(30) NOT NULL DEFAULT 'pending'::character varying CHECK (
    status::text = ANY (
      ARRAY[
        'pending'::character varying,
        'settlement'::character varying,
        'capture'::character varying,
        'deny'::character varying,
        'cancel'::character varying,
        'expire'::character varying,
        'failure'::character varying
      ]::text[]
    )
  ),
  fraud_status character varying(20) CHECK (
    fraud_status IS NULL OR fraud_status::text = ANY (
      ARRAY['accept'::character varying, 'challenge'::character varying, 'deny'::character varying]::text[]
    )
  ),
  payment_type character varying(50),
  snap_token text,
  redirect_url text,
  paid_at timestamp with time zone,
  expired_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id)
    REFERENCES public.invoices(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);

-- 2. Buat Tabel public.webhook_events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_key character varying(150) NOT NULL UNIQUE,
  provider character varying(30) NOT NULL DEFAULT 'midtrans'::character varying,
  invoice_id uuid,
  payment_id uuid,
  midtrans_order_id character varying(60) NOT NULL,
  transaction_id character varying(100),
  transaction_status character varying(30) NOT NULL,
  fraud_status character varying(20),
  status_code character varying(10),
  gross_amount character varying(30) NOT NULL,
  payment_type character varying(50),
  signature_key character varying(150) NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  processing_status character varying(30) NOT NULL DEFAULT 'received'::character varying CHECK (
    processing_status::text = ANY (
      ARRAY[
        'received'::character varying,
        'processed'::character varying,
        'ignored_duplicate'::character varying,
        'rejected_signature'::character varying,
        'rejected_amount'::character varying,
        'failed'::character varying
      ]::text[]
    )
  ),
  raw_payload jsonb NOT NULL,
  error_message text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_pkey PRIMARY KEY (id),
  CONSTRAINT fk_webhook_events_invoice FOREIGN KEY (invoice_id)
    REFERENCES public.invoices(id) ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT fk_webhook_events_payment FOREIGN KEY (payment_id)
    REFERENCES public.payments(id) ON UPDATE NO ACTION ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_invoice_id ON public.webhook_events (invoice_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON public.webhook_events (payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_midtrans_order_id ON public.webhook_events (midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_transaction_id ON public.webhook_events (transaction_id);

-- 3. Selaraskan CHECK constraint status pembayaran pada public.invoices
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check CHECK (
    status::text = ANY (
      ARRAY[
        'UNPAID'::character varying,
        'PAID'::character varying,
        'belum_lunas'::character varying,
        'lunas'::character varying
      ]::text[]
    )
  );
