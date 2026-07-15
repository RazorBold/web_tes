import type { Metadata } from "next";
import Link from "next/link";
import SwaggerUI from "./swagger";

export const metadata: Metadata = {
  title: "API Docs — SuperWeb IoT",
  description: "Dokumentasi interaktif REST API SuperWeb IoT (OpenAPI 3.1 + Swagger UI).",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">SuperWeb IoT — API Reference</h1>
            <p className="text-sm text-slate-500">
              OpenAPI 3.1 · lihat juga{" "}
              <a href="/openapi.json" className="text-blue-600 hover:underline">
                openapi.json
              </a>
            </p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Kembali ke dashboard
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl">
        <SwaggerUI url="/openapi.json" />
      </div>
    </main>
  );
}
