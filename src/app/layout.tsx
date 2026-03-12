import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import ViewportFix from "@/components/ViewportFix";
import { getActiveFontVariables } from "@/lib/fonts";
import presetsJson from "@/lib/landing-page-presets-custom.json";

import "./globals.css";

const ACTIVE_PRESET_ID = 11;
const preset = presetsJson.find(p => p.id === ACTIVE_PRESET_ID);

function getBrandStyle() {
  if (!preset) return {};
  const [h, s, l] = preset.primary.trim().split(/\s+/);
  return { "--brand-h": h, "--brand-s": s, "--brand-l": l } as React.CSSProperties;
}

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
      <body className="antialiased preset-balanced" style={getBrandStyle()} suppressHydrationWarning>
        <ViewportFix />
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
