import type { ReactNode } from "react";

import PageTransition from "@/components/layout/PageTransition";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <section className="flex min-h-screen flex-col bg-background">
      <PageTransition>
        <div className="flex flex-1 flex-col">{children}</div>
      </PageTransition>
    </section>
  );
}
