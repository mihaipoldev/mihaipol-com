"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type PublicThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function PublicThemeProvider({ children, ...props }: PublicThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      storageKey="public-theme"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
