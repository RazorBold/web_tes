import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultAiAssignments, type AiMode } from "@/config/cctv";

interface CctvAiState {
  /** Model AI yang aktif per kamera — diatur di Settings, dipakai halaman CCTV */
  assignments: Record<string, AiMode[]>;
  toggleMode: (camId: string, mode: AiMode) => void;
  setModes: (camId: string, modes: AiMode[]) => void;
  resetDefaults: () => void;
}

export const useCctvAiStore = create<CctvAiState>()(
  persist(
    (set) => ({
      assignments: defaultAiAssignments,
      toggleMode: (camId, mode) =>
        set((state) => {
          const current = state.assignments[camId] ?? [];
          const next = current.includes(mode)
            ? current.filter((m) => m !== mode)
            : [...current, mode];
          return { assignments: { ...state.assignments, [camId]: next } };
        }),
      setModes: (camId, modes) =>
        set((state) => ({ assignments: { ...state.assignments, [camId]: modes } })),
      resetDefaults: () => set({ assignments: defaultAiAssignments }),
    }),
    {
      name: "cctv-ai-assignments",
      // Naikkan `version` setiap kali katalog AI_MODELS atau `aiModes` bawaan
      // kamera di config/cctv.ts berubah. Tanpa ini, localStorage yang sudah
      // tersimpan di browser akan terus menang atas nilai bawaan yang baru —
      // gejalanya: config bilang kamera 1 punya 3 model, tapi layar cuma
      // menampilkan 1, dan satu-satunya jalan keluar adalah menekan "Reset ke
      // Default" di Settings secara manual.
      //
      // v2: model `face` (Face Recognition) masuk katalog & kamera 3 dipindah
      //     dari people+gender menjadi face+gender+mood.
      version: 2,
      // Hanya `assignments` yang disimpan (fungsi aksi tidak bisa di-serialize),
      // sekaligus membuat tipe kembalian `migrate` di bawah persis sepadan.
      partialize: (state) => ({ assignments: state.assignments }),
      migrate: () => ({ assignments: defaultAiAssignments }),
    }
  )
);
