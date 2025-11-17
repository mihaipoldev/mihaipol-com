import type { ReactNode } from "react";

import ConditionalDevLayout from "@/components/layout/ConditionalDevLayout";
import { PublicThemeProvider } from "@/components/theme/PublicThemeProvider";

type DevLayoutProps = {
  children: ReactNode;
};

export default function DevLayout({ children }: DevLayoutProps) {
  return (
    <PublicThemeProvider>
      <ConditionalDevLayout>{children}</ConditionalDevLayout>
    </PublicThemeProvider>
  );
}
