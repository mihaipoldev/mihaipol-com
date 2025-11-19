import type { Metadata } from "next";
import { headers } from "next/headers";

import { Toaster } from "@/components/ui/sonner";
import { AdminColorStyle } from "@/components/admin/AdminColorStyle";
import { InstantColorApply } from "@/components/admin/InstantColorApply";
import { QueryProvider } from "@/components/providers/QueryProvider";
import ViewportFix from "@/components/ViewportFix";
import "@/lib/fontawesome";

import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-ssr";
import { hexToHsl } from "@/lib/colorUtils";
import { getAllFontVariables, geistMono, activeFontPairing } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "Mihai Pol",
    template: "%s - Mihai Pol",
  },
  description: "Electronic music artist. Music and creative works by Mihai Pol",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if we're on an admin page to conditionally inject color style
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isRootPage = pathname === "/";

  return (
    <html lang="en" suppressHydrationWarning className={`dark ${getAllFontVariables()}`}>
      <body className="antialiased" suppressHydrationWarning>
        <ViewportFix />
        {/* AdminColorStyle applies server-side color IMMEDIATELY from database (runs first) */}
        {isAdminPage && <AdminColorStyle />}
        {/* InstantColorApply applies color from sessionStorage as fallback (runs after, only if AdminColorStyle didn't apply) */}
        <InstantColorApply />
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
