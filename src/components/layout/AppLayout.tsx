"use client";

import React, { useState, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-800 flex flex-col font-sans antialiased print:bg-white print:min-h-0">
      <div className="print:hidden">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
      </div>
      <div className="flex-1 flex relative overflow-x-clip w-full print:block print:w-full print:overflow-visible">
        <div className="print:hidden">
          <Suspense
            fallback={
              <aside
                style={{ height: "calc(100vh - 4rem)" }}
                className={`bg-white shrink-0 hidden md:block sticky top-16 self-start transition-[width] duration-300 ease-in-out ${
                  isSidebarOpen
                    ? "w-60 border-r border-slate-200/90"
                    : "w-0 border-r-0"
                }`}
              />
            }
          >
            <Sidebar
              isOpen={isSidebarOpen}
              onCloseMobile={closeMobileSidebar}
            />
          </Suspense>
        </div>
        <main className="flex-1 min-w-0 p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out print:p-0 print:m-0 print:max-w-none print:w-full print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
