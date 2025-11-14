import Link from "next/link";

const footerLinks = [
  { href: "#", label: "Docs" },
  { href: "#", label: "Status" },
  { href: "#", label: "Support" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} mihai-pol. All rights reserved.</p>
        <div className="flex gap-4">
          {footerLinks.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
