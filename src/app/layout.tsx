import type { Metadata } from "next";
import { headers } from "next/headers";

import { Toaster } from "@/components/ui/sonner";
import { AdminColorStyle } from "@/components/admin/initializers/AdminColorStyle";
import { InstantColorApply } from "@/components/admin/initializers/InstantColorApply";
import { QueryProvider } from "@/providers/QueryProvider";
import ViewportFix from "@/components/ViewportFix";
import "@/lib/fontawesome";

import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-ssr";
import { hexToHsl } from "@/lib/colorUtils";
// Import all fonts so Next.js can detect them, but we'll only use the active pairing
import {
  roboto,
  openSans,
  montserrat,
  dmSans,
  sourceCodePro,
  spaceGrotesk,
  josefinSans,
  rubik,
  inter,
  poppins,
  raleway,
  nunitoSans,
  geistMono,
  activeFontPairing,
} from "@/lib/fonts";

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
    <html lang="en" suppressHydrationWarning className={`dark ${roboto.variable} ${activeFontPairing.heading.variable} ${activeFontPairing.body.variable} ${geistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Disable browser scroll restoration - we handle it manually
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
            `,
          }}
        />
      </head>
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
