"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type AdminThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function AdminThemeProvider({ children, ...props }: AdminThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      storageKey="admin-theme"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
