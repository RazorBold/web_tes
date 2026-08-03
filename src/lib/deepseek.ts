// Klien DeepSeek — HANYA UNTUK SERVER. Modul ini memegang kunci API; jangan
// pernah diimpor dari komponen klien.
//
// API-nya sekompatibel OpenAI (POST /chat/completions, Bearer token), jadi tidak
// perlu SDK tambahan — satu `fetch` sudah cukup dan menghemat satu dependensi.

const API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";
const TIMEOUT_MS = 45_000;

export class LlmError extends Error {
  constructor(message: string, readonly status: number = 502) {
    super(message);
    this.name = "LlmError";
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
}

export interface ChatResult {
  reply: string;
  usage: { promptTokens: number; completionTokens: number };
}

/**
 * Buang penanda markdown yang tersisa.
 *
 * Prompt sudah melarangnya, tapi larangan prompt bukan jaminan — dan gelembung
 * chat menampilkan teks apa adanya, jadi satu `**` yang lolos langsung terlihat
 * sebagai bintang di layar. Ini jaring pengaman terakhirnya.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)\*(?!\s)(.+?)(?<!\s)\*(?=\s|$|[.,!?])/g, "$1$2")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-•]\s+/gm, "• ")
    .trim();
}

export async function chatCompletion(messages: ChatMessage[]): Promise<ChatResult> {
  // Dibaca di dalam fungsi, bukan di lingkup modul: nilai lingkup modul ikut
  // terbaca saat `next build` mengumpulkan route, bukan saat request berjalan.
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new LlmError("DEEPSEEK_API_KEY belum diisi di .env.local", 500);
  }

  // Jangan biarkan panel chat menggantung tanpa batas kalau API-nya diam.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
        messages,
        // Jawaban tentang angka dashboard harus taat data, bukan mengarang;
        // suhu rendah menekan kecenderungan berimprovisasi.
        temperature: 0.3,
        max_tokens: 700,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new LlmError("DeepSeek tidak merespons dalam 45 detik", 504);
    }
    throw new LlmError(err instanceof Error ? err.message : "Gagal menghubungi DeepSeek");
  } finally {
    clearTimeout(timer);
  }

  const json = (await res.json().catch(() => null)) as ChatCompletion | null;

  if (!res.ok) {
    // Pesan dari API diteruskan apa adanya — itu yang menjelaskan kunci salah,
    // kuota habis, atau model tidak dikenal.
    throw new LlmError(json?.error?.message ?? `DeepSeek membalas HTTP ${res.status}`, res.status);
  }

  const raw = json?.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new LlmError("DeepSeek membalas tanpa isi");

  return {
    reply: stripMarkdown(raw),
    usage: {
      promptTokens: json?.usage?.prompt_tokens ?? 0,
      completionTokens: json?.usage?.completion_tokens ?? 0,
    },
  };
}
