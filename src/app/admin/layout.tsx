import type { ReactNode } from "react";
import { 
  Roboto, 
  Open_Sans, 
  Montserrat, 
  EB_Garamond, 
  Source_Code_Pro, 
  Space_Grotesk, 
  Josefin_Sans, 
  Lato 
} from "next/font/google";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { AdminBodyClass } from "@/components/admin/AdminBodyClass";

// Font Pairing 1: Roboto + Open Sans
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

// Font Pairing 2: Montserrat + EB Garamond
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-eb-garamond",
  display: "swap",
});

// Font Pairing 3: Source Code Pro + Space Grotesk
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-code-pro",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Font Pairing 4: Josefin Sans + Lato
const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-josefin-sans",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <>
      <AdminBodyClass />
      <div className={`preset-balanced font-sans flex min-h-screen flex-col bg-background ${roboto.variable} ${openSans.variable} ${montserrat.variable} ${ebGaramond.variable} ${sourceCodePro.variable} ${spaceGrotesk.variable} ${josefinSans.variable} ${lato.variable}`}>
      <div className="flex flex-1">
        {/* Desktop Sidebar - Full Height */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
          <AdminSidebar />
        </aside>
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col lg:pl-64">
          <div className="mx-auto w-full max-w-[1400px] px-4 md:px-10 lg:px-16">
            <AdminHeader />
            <AdminPageTransition>
              <div className="flex flex-1 flex-col py-4">{children}</div>
            </AdminPageTransition>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
