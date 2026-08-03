import React from "react";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import Footer from "@/components/layout/footer";
import AiAssistant from "@/components/layout/ai-assistant";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Topbar />

        {/* Dynamic Inner Page Content */}
        <main className="flex-1 overflow-y-auto flex flex-col px-8 py-8 bg-[url('/background-body.png')] bg-cover bg-center bg-fixed bg-no-repeat">
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>

        {/* Static Bottom Bar */}
        <Footer />
      </div>

      {/* Floating AI Assistant */}
      <AiAssistant />
    </div>
  );
}
