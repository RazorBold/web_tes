"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Send, Sparkles, RotateCcw, Minus } from "lucide-react";
import logoLLM from "@/images/logoLLM.png";

interface ChatMessage {
  id: number;
  role: "user" | "ai";
  text: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "ai",
    text: "Halo! Saya AI Telkom. Tanyakan apa saja seputar data CCTV, sensor, atau kondisi infrastruktur di platform ini.",
  },
];

const suggestedPrompts = [
  "Bagaimana kondisi CCTV hari ini?",
  "Berapa penggunaan air bulan ini?",
  "Cek status energi & listrik",
  "Apakah ada potensi banjir?",
];

/** Jeda sebelum panel menyapa sendiri, agar halaman selesai dimuat lebih dulu. */
const AUTO_OPEN_DELAY_MS = 4000;
/**
 * Ditandai di sessionStorage supaya panel menyapa **satu kali per sesi** saja.
 * Tanpa ini, popup akan menyembul lagi setiap kali halaman di-refresh — cepat
 * terasa mengganggu. sessionStorage hanya dibaca di dalam effect (bukan saat
 * render) supaya markup server & client tetap sama dan tidak kena hydration error.
 */
const GREETED_KEY = "ai-telkom-greeted";

/**
 * Kirim pertanyaan ke DeepSeek lewat route server kita.
 *
 * Dulu fungsi ini mencocokkan kata kunci lalu membalas kalimat hafalan berisi
 * angka hardcoded — yang celakanya sudah tidak cocok lagi dengan isi database.
 * Sekarang jawabannya disusun LLM dari potret data yang sebenarnya.
 */
async function fetchAiReply(question: string, history: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/v1/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: question,
      history: history.map((m) => ({ role: m.role, text: m.text })),
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Asisten tidak merespons (HTTP ${res.status})`);
  }
  return json.data.reply as string;
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sapa sendiri sekali per sesi.
  useEffect(() => {
    if (sessionStorage.getItem(GREETED_KEY)) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(GREETED_KEY, "1");
      setOpen(true);
    }, AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Jaga tampilan tetap di pesan terbaru.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const openByUser = () => {
    sessionStorage.setItem(GREETED_KEY, "1");
    setOpen(true);
    // Fokus hanya saat dibuka manual — kalau panel menyapa sendiri, merebut
    // kursor dari halaman yang sedang dibaca terasa kasar.
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const closePanel = () => {
    sessionStorage.setItem(GREETED_KEY, "1");
    setOpen(false);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    // Cegah kiriman bertumpuk: satu pertanyaan diproses dulu sampai selesai.
    if (!trimmed || typing) return;

    const history = messages;
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);

    try {
      const reply = await fetchAiReply(trimmed, history);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: reply }]);
    } catch (err) {
      // Kegagalan ditampilkan apa adanya sebagai pesan, bukan disembunyikan —
      // asisten yang diam saat gagal membuat orang mengira pesannya terkirim.
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: `Maaf, saya sedang tidak bisa menjawab. ${err instanceof Error ? err.message : ""}`.trim(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleReset = () => {
    setMessages(initialMessages);
    setInput("");
    setTyping(false);
    inputRef.current?.focus();
  };

  return (
    // Wrapper tidak menangkap klik; hanya kartu & tombol yang interaktif, jadi
    // halaman di belakang tetap bisa dipakai sambil panel terbuka.
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* ── PANEL CHAT ── */}
      {open && (
        <div
          role="dialog"
          aria-label="AI Telkom Assistant"
          className="pointer-events-auto flex flex-col w-[min(384px,calc(100vw-2rem))] h-[min(72vh,560px)] bg-white rounded-3xl overflow-hidden origin-bottom-right animate-pop-in border border-slate-200/80 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]"
        >
          {/* Header bergradien brand */}
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 flex-shrink-0 bg-gradient-to-br from-brand-red to-red-700 relative overflow-hidden">
            {/* Aksen dekoratif */}
            <span className="absolute -right-6 -top-10 h-24 w-24 rounded-full bg-white/10 pointer-events-none" />
            <span className="absolute -right-10 -bottom-12 h-20 w-20 rounded-full bg-white/10 pointer-events-none" />

            <div className="flex items-center gap-3 min-w-0 relative">
              <div className="h-11 w-11 rounded-full overflow-hidden bg-white/95 ring-2 ring-white/40 flex-shrink-0">
                <Image src={logoLLM} alt="AI Telkom" className="w-full h-full object-cover scale-125" />
              </div>
              <div className="min-w-0 leading-tight">
                <h3 className="text-[15px] font-extrabold text-white truncate">AI Telkom Assistant</h3>
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-white/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse flex-shrink-0" />
                  Online · Siap membantu
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 relative">
              <button
                onClick={handleReset}
                title="Reset percakapan"
                aria-label="Reset percakapan"
                className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={closePanel}
                title="Tutup"
                aria-label="Tutup panel"
                className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Daftar pesan */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 space-y-3 bg-slate-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end gap-2 animate-bubble-in ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "ai" && (
                  <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0 bg-white border border-slate-200">
                    <Image src={logoLLM} alt="" className="w-full h-full object-cover scale-125" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-brand-red text-white rounded-2xl rounded-br-md"
                      : "bg-white text-slate-700 border border-slate-200/90 rounded-2xl rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-end gap-2 justify-start animate-bubble-in">
                <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0 bg-white border border-slate-200">
                  <Image src={logoLLM} alt="" className="w-full h-full object-cover scale-125" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1 shadow-sm">
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            {messages.length === 1 && !typing && (
              <div className="pt-1 space-y-2 animate-bubble-in">
                <span className="block text-[12px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Coba tanyakan
                </span>
                <div className="flex flex-col gap-2">
                  {suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="text-left text-[14px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 hover:border-brand-red/50 hover:text-brand-red hover:bg-red-50/50 transition-colors cursor-pointer shadow-sm"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kolom input */}
          <div className="p-3 border-t border-slate-100 flex-shrink-0 bg-white">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-3 pr-1.5 py-1.5 focus-within:border-brand-red/50 focus-within:bg-white transition-colors">
              <Sparkles className="h-4 w-4 text-brand-red flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder={typing ? "AI Telkom sedang menjawab…" : "Tanya sesuatu ke AI Telkom..."}
                className="flex-1 min-w-0 bg-transparent text-[14px] text-slate-700 focus:outline-none placeholder-slate-400"
              />
              {/* Tombol ikut nonaktif selagi menunggu jawaban — `sendMessage`
                  menolak kiriman bertumpuk, jadi tombol yang tetap menyala hanya
                  membuat orang mengira klik-nya tidak berfungsi. */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || typing}
                aria-label="Kirim pesan"
                className="h-8 w-8 rounded-full bg-brand-red text-white flex items-center justify-center flex-shrink-0 hover:bg-brand-red-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOMBOL MASCOT ── */}
      <div className="pointer-events-auto flex items-center gap-3">
        {!open && (
          <span className="hidden sm:block bg-white text-slate-700 text-[14px] font-bold px-4 py-2.5 rounded-full shadow-lg border border-slate-200 whitespace-nowrap animate-bubble-in">
            Tanya AI Telkom Saja!
          </span>
        )}
        <button
          onClick={open ? closePanel : openByUser}
          aria-label={open ? "Tutup AI Telkom" : "Buka AI Telkom"}
          className="relative h-20 w-20 rounded-full overflow-hidden shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
        >
          <Image src={logoLLM} alt="AI Telkom" className="w-full h-full object-cover scale-125" />
          {open && (
            <span className="absolute inset-0 bg-slate-900/55 flex items-center justify-center">
              <Minus className="h-7 w-7 text-white" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
