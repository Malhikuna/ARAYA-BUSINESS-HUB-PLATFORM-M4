"use client";

import React, { useState, useCallback, useSyncExternalStore, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

const subscribeWindow = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};
const getWindowWidth = () => (typeof window !== "undefined" ? window.innerWidth : 1280);
const getServerWidth = () => 1280;

export function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const windowWidth = useSyncExternalStore(subscribeWindow, getWindowWidth, getServerWidth);
  // HP (< 768px) & Tablet (768px-1023px) memakai Overlay Drawer (tertutup default, tidak menggeser konten).
  // Laptop/Desktop (>= 1024px / lg:) memakai Push Sticky Sidebar (terbuka default).
  const isDrawerViewport = windowWidth < 1024;
  const isDesktopViewport = windowWidth >= 1024;

  const [manualDesktopOpen, setManualDesktopOpen] = useState<boolean | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isDesktopSidebarOpen = manualDesktopOpen !== null ? manualDesktopOpen : isDesktopViewport;

  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsDrawerOpen((prev) => !prev);
    } else {
      setManualDesktopOpen((prev) => {
        const current = prev !== null ? prev : (typeof window !== "undefined" && window.innerWidth >= 1024);
        return !current;
      });
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const currentSidebarOpen = isDrawerViewport ? isDrawerOpen : isDesktopSidebarOpen;

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-800 flex flex-col font-sans antialiased print:bg-white print:min-h-0">
      <Navbar
        isSidebarOpen={currentSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className="flex-1 flex relative overflow-x-clip w-full print:block print:w-full print:overflow-visible">
        <Suspense
          fallback={
            <aside
              style={{ height: "calc(100vh - 4rem)" }}
              className={`bg-white shrink-0 hidden lg:block print:hidden sticky top-16 self-start transition-[width] duration-300 ease-in-out ${
                isDesktopSidebarOpen
                  ? "w-60 border-r border-slate-200/90"
                  : "w-0 border-r-0"
              }`}
            />
          }
        >
          <Sidebar
            isOpen={isDesktopSidebarOpen}
            isDesktopOpen={isDesktopSidebarOpen}
            isMobileOpen={isDrawerOpen}
            onCloseMobile={closeDrawer}
          />
        </Suspense>
        <main className="@container flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out print:p-0 print:m-0 print:max-w-none print:w-full print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
