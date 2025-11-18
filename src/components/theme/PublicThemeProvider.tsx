"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type PublicThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function PublicThemeProvider({ children, ...props }: PublicThemeProviderProps) {
  // Clear any stored theme preference on mount to ensure dark is always the default
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("public-theme");
      localStorage.removeItem("theme");
      // Clear any other potential next-themes storage keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("theme") || key.includes("theme")) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="public-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
