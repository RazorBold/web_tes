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
