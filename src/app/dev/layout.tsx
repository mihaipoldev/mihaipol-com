import type { ReactNode } from "react";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PageTransition from "@/components/layout/PageTransition";

type DevLayoutProps = {
  children: ReactNode;
};

export default function DevLayout({ children }: DevLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageTransition>
        <main className="flex-1 w-full">
          <div className="mx-auto w-full max-w-[1400px] px-10 md:px-16 lg:px-28">
            {children}
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}

