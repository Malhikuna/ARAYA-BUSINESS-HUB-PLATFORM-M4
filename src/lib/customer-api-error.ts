import type { FormErrors } from "@/types/customer";

interface ErrorEnvelopeShape {
  code?: unknown;
  message?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
    fields?: Record<string, unknown> | null;
  } | null;
}

export interface ParsedCustomerApiError {
  field: keyof FormErrors;
  error: string;
}

/**
 * Parser respons error API Pelanggan sesuai amplop standar backend
 * `{ success: false, error: { code, message, fields } }` (TC-M4US1-06 / HTTP 409).
 */
export function parseCustomerApiError(
  status: number,
  payload: unknown,
  fallbackMessage = "Gagal menyimpan data pelanggan."
): ParsedCustomerApiError {
  const body =
    payload && typeof payload === "object" ? (payload as ErrorEnvelopeShape) : {};
  const errorObj = body.error && typeof body.error === "object" ? body.error : null;

  const code = String(errorObj?.code ?? body.code ?? "").trim().toUpperCase();
  const message =
    typeof errorObj?.message === "string" && errorObj.message.trim()
      ? errorObj.message.trim()
      : typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : "";
  const fields =
    errorObj?.fields && typeof errorObj.fields === "object" ? errorObj.fields : null;

  if (code === "DUPLICATE_EMAIL" || (status === 409 && typeof fields?.email === "string")) {
    return {
      field: "email",
      error:
        (typeof fields?.email === "string" && fields.email.trim()) ||
        message ||
        "Alamat email sudah terdaftar untuk pelanggan lain.",
    };
  }

  if (code === "DUPLICATE_PHONE" || (status === 409 && typeof fields?.phone === "string")) {
    return {
      field: "phone",
      error:
        (typeof fields?.phone === "string" && fields.phone.trim()) ||
        message ||
        "Nomor telepon/WhatsApp sudah terdaftar untuk pelanggan lain.",
    };
  }

  if (fields) {
    const fieldOrder: Array<keyof FormErrors> = ["name", "phone", "email", "address"];
    for (const key of fieldOrder) {
      const val = fields[key];
      if (typeof val === "string" && val.trim()) {
        return { field: key, error: val.trim() };
      }
    }
  }

  return {
    field: "name",
    error: message || fallbackMessage,
  };
}
