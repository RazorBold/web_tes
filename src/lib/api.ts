import ky from "ky";

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    pagination?: { page: number; pageSize: number; total: number; totalPages: number };
  };
}

export const api = ky.create({
  prefix: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
});

export async function apiGet<T>(path: string, searchParams?: Record<string, string>): Promise<T> {
  const res = await api.get(path, searchParams ? { searchParams } : undefined).json<ApiEnvelope<T>>();
  return res.data;
}

/** Amplop galat dari `fail()` di lib/api-response.ts. */
interface ApiError {
  error?: { code?: string; message?: string };
}

/**
 * POST dengan penanganan galat yang membawa PESAN dari server.
 *
 * ky melempar HTTPError berpesan generik ("Request failed with status code
 * 502"), padahal route kita sudah menyertakan alasan yang sebenarnya berguna.
 * Tanpa membongkar badan responsnya, toast galat hanya akan memampangkan nomor
 * status — tidak membantu siapa pun yang harus membereskannya.
 */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  try {
    const res = await api.post(path, body === undefined ? undefined : { json: body }).json<ApiEnvelope<T>>();
    return res.data;
  } catch (err) {
    const resp = (err as { response?: Response }).response;
    if (resp) {
      const isi = (await resp.json().catch(() => null)) as ApiError | null;
      if (isi?.error?.message) throw new Error(isi.error.message);
    }
    throw err;
  }
}
