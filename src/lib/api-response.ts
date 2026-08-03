import { NextResponse } from "next/server";

export function ok<T>(
  data: T,
  pagination?: { page: number; pageSize: number; total: number }
) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(pagination && {
        pagination: { ...pagination, totalPages: Math.ceil(pagination.total / pagination.pageSize) },
      }),
    },
  });
}

export function notFound(message: string) {
  return fail("RESOURCE_NOT_FOUND", message, 404);
}

/** Padanan `ok()` untuk jalur gagal, supaya bentuk amplopnya tetap sama. */
export function fail(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
      meta: { timestamp: new Date().toISOString() },
    },
    { status }
  );
}
