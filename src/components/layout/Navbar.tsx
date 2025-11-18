"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dev/events", label: "Events" },
  { href: "/dev/albums", label: "Albums" },
  { href: "/dev/updates", label: "Updates" },
  { href: "#contact", label: "Contact", isHash: true },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent"></div>
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-10 md:px-16 lg:px-28">
        {/* Logo on the left */}
        <Link
          href="/dev"
          className="text-2xl sm:text-3xl font-bold tracking-widest uppercase text-foreground hover:text-foreground/80 transition-colors duration-300 relative group"
        >
          <span className="relative z-10">Mihai Pol</span>
          <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground/30 group-hover:w-full transition-all duration-500 ease-out"></span>
        </Link>
        {/* Centered menu items */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 md:gap-10 text-base font-bold">
          {navLinks.map((link) => {
            const isActive = link.isHash ? false : (pathname === link.href || (pathname?.startsWith(link.href + "/") && pathname !== link.href));
            const handleClick = link.isHash ? (e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              const footer = document.getElementById("contact");
              if (footer) {
                footer.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            } : undefined;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleClick}
                className={cn(
                  "transition-all duration-300 relative group py-2",
                  isActive
                    ? "text-foreground"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                <span className="relative z-10">{link.label}</span>
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-px bg-foreground/50 transition-all duration-300 ease-out",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
