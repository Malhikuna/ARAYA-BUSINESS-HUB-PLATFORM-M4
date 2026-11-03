import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guard';
import { generateTraceId } from '@/lib/auth/response';
import {
  findQuotationById,
  findInvoiceByQuotationId,
  saveInvoice,
  getInvoiceCount,
} from '@/lib/sales/store';
import {
  convertQuotationToInvoiceDomain,
  QuotationNotApprovedError,
  EmptyQuotationItemsError,
  QuotationAlreadyConvertedError,
} from '@/lib/sales/quotation-converter';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const traceId = request.headers.get('x-request-id') || generateTraceId();
  const { id } = await params;

  // 1. Verifikasi peran (Admin atau Partner pemilik quotation)
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Autentikasi diperlukan untuk mengonversi quotation.',
          details: [],
          trace_id: traceId,
        },
      },
      { status: 401, headers: { 'X-Request-Id': traceId } }
    );
  }

  // 2. Ambil data Quotation
  const quotation = findQuotationById(id);
  if (!quotation) {
    return NextResponse.json(
      {
        error: {
          code: 'QUOTATION_NOT_FOUND',
          message: `Quotation dengan ID '${id}' tidak ditemukan.`,
          details: [{ field: 'id', issue: 'not found' }],
          trace_id: traceId,
        },
      },
      { status: 404, headers: { 'X-Request-Id': traceId } }
    );
  }

  // 3. Batasi otorisasi: Partner hanya boleh mengonversi penawaran milik partner_id-nya
  if (user.role === 'Partner' && user.partnerId && quotation.partnerId !== user.partnerId) {
    return NextResponse.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Partner hanya dapat mengonversi quotation milik unit usahanya.',
          details: [],
          trace_id: traceId,
        },
      },
      { status: 403, headers: { 'X-Request-Id': traceId } }
    );
  }

  // 4. Periksa apakah quotation sudah pernah dikonversi
  const existingInvoice = findInvoiceByQuotationId(quotation.id);

  // 5. Eksekusi konversi melalui domain logic
  try {
    const nextSeq = getInvoiceCount() + 1;
    const invoice = convertQuotationToInvoiceDomain(quotation, existingInvoice, {
      invoiceSequenceNumber: nextSeq,
    });

    // Simpan invoice hasil konversi
    saveInvoice(invoice);

    return NextResponse.json(
      {
        message: 'Quotation berhasil dikonversi menjadi invoice.',
        data: {
          invoice: {
            id: invoice.id,
            invoice_number: invoice.number,
            quotation_id: invoice.quotationId,
            status: invoice.status, // 'ISSUED' (Belum lunas)
            status_label: 'Belum lunas',
            issue_date: invoice.issueDate,
            due_date: invoice.dueDate,
            subtotal: invoice.subtotal,
            discount_total: invoice.discountTotal,
            tax_total: invoice.taxTotal,
            grand_total: invoice.grandTotal,
            pay_url: invoice.payUrl,
            items: invoice.items.map((it) => ({
              product_id: it.productId,
              name: it.nameSnapshot,
              quantity: it.quantity,
              unit_price: it.unitPriceSnapshot,
              discount: it.discount,
              tax_rate: it.taxRateSnapshot,
              line_net: it.lineNet,
              line_tax: it.lineTax,
              line_total: it.lineTotal,
            })),
          },
        },
      },
      { status: 201, headers: { 'X-Request-Id': traceId } }
    );
  } catch (err) {
    if (err instanceof QuotationNotApprovedError) {
      // M4-US2-AC2: Tolak jika status belum disetujui (HTTP 422 Unprocessable Entity)
      return NextResponse.json(
        {
          error: {
            code: 'QUOTATION_NOT_APPROVED',
            message: err.message,
            details: [
              {
                field: 'status',
                issue: `Status saat ini '${quotation.status}', wajib 'ACCEPTED' (Disetujui)`,
              },
            ],
            trace_id: traceId,
          },
        },
        { status: 422, headers: { 'X-Request-Id': traceId } }
      );
    }

    if (err instanceof EmptyQuotationItemsError) {
      // M4-US2-AC3: Tolak jika item kosong
      return NextResponse.json(
        {
          error: {
            code: 'EMPTY_QUOTATION_ITEMS',
            message: err.message,
            details: [{ field: 'items', issue: 'Item penawaran tidak boleh kosong' }],
            trace_id: traceId,
          },
        },
        { status: 422, headers: { 'X-Request-Id': traceId } }
      );
    }

    if (err instanceof QuotationAlreadyConvertedError) {
      return NextResponse.json(
        {
          error: {
            code: 'QUOTATION_ALREADY_CONVERTED',
            message: err.message,
            details: [{ field: 'quotation_id', issue: 'Sudah memiliki invoice terkait' }],
            trace_id: traceId,
          },
        },
        { status: 409, headers: { 'X-Request-Id': traceId } }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Terjadi kesalahan sistem saat mengonversi quotation.',
          details: [],
          trace_id: traceId,
        },
      },
      { status: 500, headers: { 'X-Request-Id': traceId } }
    );
  }
}
