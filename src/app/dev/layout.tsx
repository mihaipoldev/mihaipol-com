import type { ReactNode } from "react";

import ConditionalDevLayout from "@/components/layout/ConditionalDevLayout";

type DevLayoutProps = {
  children: ReactNode;
};

export default function DevLayout({ children }: DevLayoutProps) {
  return <ConditionalDevLayout>{children}</ConditionalDevLayout>;
}
