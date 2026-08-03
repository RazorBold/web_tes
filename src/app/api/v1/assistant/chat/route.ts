import { chatCompletion, LlmError, type ChatMessage } from "@/lib/deepseek";
import { getPlatformContext, buildSystemPrompt } from "@/lib/assistant-context";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Riwayat yang ikut dikirim dibatasi supaya prompt tidak membengkak tanpa batas. */
const MAX_HISTORY = 8;
const MAX_CHARS = 1000;

interface ChatRequest {
  message?: string;
  history?: { role?: string; text?: string }[];
}

/**
 * POST /api/v1/assistant/chat   body: { message, history? }
 *
 * Menjembatani panel chat ke DeepSeek. Wajib lewat server: kunci API tidak boleh
 * sampai ke browser, dan konteks datanya diambil langsung dari MySQL — keduanya
 * mustahil dilakukan dari sisi klien.
 */
export async function POST(request: Request) {
  let payload: ChatRequest;
  try {
    payload = (await request.json()) as ChatRequest;
  } catch {
    return fail("BAD_REQUEST", "Body JSON tidak valid", 400);
  }

  const message = payload.message?.trim();
  if (!message) return fail("BAD_REQUEST", "Pertanyaan tidak boleh kosong", 400);
  if (message.length > MAX_CHARS) {
    return fail("BAD_REQUEST", `Pertanyaan terlalu panjang (maks ${MAX_CHARS} karakter)`, 400);
  }

  try {
    const context = await getPlatformContext();

    // Riwayat percakapan diteruskan supaya pertanyaan lanjutan ("kalau yang
    // kemarin?") tetap punya rujukan. Diambil yang terbaru saja.
    const history: ChatMessage[] = (payload.history ?? [])
      .filter((m) => m?.text && (m.role === "user" || m.role === "ai"))
      .slice(-MAX_HISTORY)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: String(m.text).slice(0, MAX_CHARS),
      }));

    const { reply, usage } = await chatCompletion([
      { role: "system", content: buildSystemPrompt(context) },
      ...history,
      { role: "user", content: message },
    ]);

    return ok({ reply, usage });
  } catch (err) {
    if (err instanceof LlmError) return fail("LLM_ERROR", err.message, err.status);
    return fail("LLM_ERROR", err instanceof Error ? err.message : "Gagal menghubungi asisten", 502);
  }
}
