import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import ViewportFix from "@/components/ViewportFix";
import { getActiveFontVariables } from "@/lib/fonts";

import "./globals.css";

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
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${getActiveFontVariables()}`}>
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
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
