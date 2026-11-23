import { prisma } from '../prisma';
import { formatRupiah } from '../format';
import { resolveDbUuid } from './partner-profile.service';
import {
  InvalidQuotationStatusError,
  QuotationForbiddenError,
  QuotationNotFoundError,
  UUID_REGEX,
  serializeQuotationFinancials,
} from './quotation.schema';

const WORKFLOW_INCLUDE = {
  customers: true,
  service_requests: {
    select: { id: true, title: true, status: true, customer_user_id: true },
  },
  quotation_items: {
    include: { products_services: true },
  },
} as const;

/**
 * Normalisasi nomor WhatsApp (08..., +62..., 62...) menjadi awalan 62 tanpa simbol non-digit.
 */
export function normalizeWhatsAppNumberTo62(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

/**
 * Susun tautan WhatsApp resmi https://wa.me/62... dengan ringkasan penawaran jasa yang rapi.
 */
export function buildWhatsAppQuotationUrl(params: {
  phone: string;
  customerName: string;
  quotationNumber: string;
  totalAmount: number | string;
}): string {
  const normalizedPhone = normalizeWhatsAppNumberTo62(params.phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new InvalidQuotationStatusError(
      'Nomor WhatsApp pelanggan tidak valid untuk membuat tautan Kirim ke WhatsApp.'
    );
  }

  const totalFormatted = formatRupiah(Number(params.totalAmount));
  const lines = [
    `Halo ${params.customerName},`,
    `Berikut penawaran layanan jasa kami dengan nomor *${params.quotationNumber}* senilai *${totalFormatted}*.`,
    'Silakan tinjau detail penawaran melalui dashboard Araya Business Hub dan klik Setujui untuk melanjutkan ke pembayaran.',
    'Terima kasih.',
  ];

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

async function findQuotationForWorkflow(id: string) {
  const isUuid = UUID_REGEX.test(id);
  const quotation = await prisma.quotations.findFirst({
    where: isUuid ? { OR: [{ id }, { quotation_number: id }] } : { quotation_number: id },
    include: WORKFLOW_INCLUDE,
  });
  if (!quotation) {
    throw new QuotationNotFoundError(id);
  }
  return quotation;
}

/**
 * Transisi draf -> terkirim, catat sent_at, dan hasilkan URL wa.me/62...
 */
export async function sendQuotationViaWhatsApp(id: string, partnerId?: string) {
  const quotation = await findQuotationForWorkflow(id);

  if (partnerId && quotation.partner_id !== partnerId) {
    throw new QuotationForbiddenError('Anda tidak memiliki akses mengirim penawaran partner lain.');
  }

  if (quotation.status !== 'draf' && quotation.status !== 'terkirim') {
    throw new InvalidQuotationStatusError(
      `Hanya penawaran berstatus 'draf' atau 'terkirim' yang dapat dikirim via WhatsApp. Status saat ini: '${quotation.status}'.`
    );
  }

  const whatsappUrl = buildWhatsAppQuotationUrl({
    phone: quotation.customers.phone,
    customerName: quotation.customers.name,
    quotationNumber: quotation.quotation_number,
    totalAmount: Number(quotation.total_amount),
  });

  if (quotation.status === 'terkirim') {
    return {
      quotation: serializeQuotationFinancials(quotation),
      whatsapp_url: whatsappUrl,
    };
  }

  const now = new Date();
  const updated = await prisma.quotations.update({
    where: { id: quotation.id },
    data: {
      status: 'terkirim',
      sent_at: now,
      updated_at: now,
    },
    include: WORKFLOW_INCLUDE,
  });

  return {
    quotation: serializeQuotationFinancials(updated),
    whatsapp_url: whatsappUrl,
  };
}

/**
 * Customer login M1 menyetujui penawaran berstatus 'terkirim' -> 'disetujui' + catat approved_at.
 */
export async function approveQuotationByCustomer(
  id: string,
  actor: { userId: string; isAdmin?: boolean }
) {
  const quotation = await findQuotationForWorkflow(id);

  if (!actor.isAdmin) {
    const actorUserUuid = resolveDbUuid(actor.userId, 'user');
    const ownerUserUuid = quotation.customers?.user_id
      ? resolveDbUuid(quotation.customers.user_id, 'user')
      : null;

    if (!ownerUserUuid || ownerUserUuid !== actorUserUuid) {
      throw new QuotationNotFoundError(id);
    }
  }

  if (quotation.status !== 'terkirim') {
    throw new InvalidQuotationStatusError(
      `Hanya penawaran berstatus 'terkirim' yang dapat disetujui Customer. Status saat ini: '${quotation.status}'.`
    );
  }

  const now = new Date();
  const updated = await prisma.quotations.update({
    where: { id: quotation.id },
    data: {
      status: 'disetujui',
      approved_at: now,
      updated_at: now,
    },
    include: WORKFLOW_INCLUDE,
  });

  return serializeQuotationFinancials(updated);
}
