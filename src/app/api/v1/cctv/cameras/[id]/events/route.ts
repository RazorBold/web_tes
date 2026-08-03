import { openAiSocket } from "@/lib/cctv-ai-socket";
import { NvrError } from "@/lib/cctv-nvr";
import { fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/cctv/cameras/:id/events  →  Server-Sent Events
 *
 * Anotasi AI dialirkan lewat server, bukan diambil browser sendiri dari
 * `wss://<nvr>/wsai/`. Dua alasannya:
 *
 *  1. Sertifikat NVR sah untuk *.icode.id tapi diakses lewat IP; browser menolak
 *     `wss://` ke IP, dan untuk WebSocket tidak ada tombol "lanjutkan saja".
 *  2. Route Handler Next tidak bisa di-upgrade jadi WebSocket — dan memang tidak
 *     perlu: anotasi hanya mengalir satu arah, jadi SSE sudah pas.
 *
 * Jenis event: `setup` (resolusi acuan + garis hitung + zona), `annotations`,
 * dan `status`.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const encoder = new TextEncoder();
  let socket: { close: () => void } | null = null;
  let heartbeat: NodeJS.Timeout | null = null;

  try {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        let open = true;
        const send = (event: string, data: unknown) => {
          if (!open) return;
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            open = false;
          }
        };

        const cleanup = () => {
          if (!open) return;
          open = false;
          socket?.close();
          if (heartbeat) clearInterval(heartbeat);
          try {
            controller.close();
          } catch {
            /* sudah tertutup */
          }
        };

        socket = openAiSocket(id, {
          onSetup: (setup) => send("setup", setup),
          onAnnotations: (annotations) => send("annotations", annotations),
          onStatus: (status) => send("status", { status }),
        });

        // Kamera-kamera ini bisa diam bermenit-menit. Tanpa denyut, perantara di
        // tengah jalan menganggap koneksi mati dan memutusnya.
        heartbeat = setInterval(() => {
          if (!open) return;
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            cleanup();
          }
        }, 20_000);

        request.signal.addEventListener("abort", cleanup);
      },
      cancel() {
        socket?.close();
        if (heartbeat) clearInterval(heartbeat);
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
        // Cegah buffering di reverse proxy — tanpa ini event bisa tertahan.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (err instanceof NvrError) {
      return fail(err.status === 404 ? "CAMERA_NOT_FOUND" : "NVR_ERROR", err.message, err.status);
    }
    return fail("NVR_ERROR", err instanceof Error ? err.message : "Gagal membuka anotasi AI", 502);
  }
}
