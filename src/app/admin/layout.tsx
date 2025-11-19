import type { ReactNode } from "react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { AdminBodyClass } from "@/components/admin/AdminBodyClass";
import { ColorInitializer } from "@/components/admin/ColorInitializer";
import { AdminThemeProvider } from "@/components/theme/AdminThemeProvider";
import { requireUserRedirect } from "@/lib/auth";
import { getGradient, getSidebarGradient } from "@/lib/gradient-presets";
import { headers } from "next/headers";
import { getAllFontVariables } from "@/lib/fonts";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Get the current pathname to check if we're on the login page
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isLoginPage = pathname === "/admin/login";

  // Skip auth check for login page
  if (!isLoginPage) {
    await requireUserRedirect();
  }

  // For login page, render without admin UI
  if (isLoginPage) {
    return <AdminThemeProvider>{children}</AdminThemeProvider>;
  }

  return (
    <AdminThemeProvider>
      <>
        <ColorInitializer />
        <AdminBodyClass />
        <div
          className={`preset-balanced font-sans flex h-screen overflow-hidden flex-col ${getGradient()} ${getAllFontVariables()}`}
        >
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Desktop Sidebar - Full Height */}
            <aside
              className={`fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border ${getSidebarGradient()} lg:block overflow-y-auto`}
            >
              <AdminSidebar />
            </aside>
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col lg:pl-64 overflow-y-auto min-h-0">
              <div className="mx-auto w-full max-w-[1400px] flex flex-col">
                <AdminHeader />
                <AdminPageTransition>
                  <div className="flex flex-col py-6 pb-4 md:pb-8 px-4 md:px-10 lg:px-12 space-y-6">
                    {children}
                  </div>
                </AdminPageTransition>
                {/* Mobile bottom spacer - creates scrollable space */}
                <div className="h-40 md:h-0 flex-shrink-0" aria-hidden="true" />
              </div>
            </main>
          </div>
        </div>
      </>
    </AdminThemeProvider>
  );
}
