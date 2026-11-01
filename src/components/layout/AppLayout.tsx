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
    <div className="min-h-screen bg-[#f3f6fa] text-slate-800 flex flex-col font-sans antialiased">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className="flex-1 flex relative overflow-x-hidden">
        <Suspense
          fallback={
            <aside
              className={`bg-white shrink-0 hidden md:block transition-[width] duration-300 ease-in-out ${
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
        <main className="flex-1 min-w-0 p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>
    </div>
  );
}
