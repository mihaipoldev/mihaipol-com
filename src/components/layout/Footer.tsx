import Link from "next/link";

type FooterProps = {
  textColor?: string;
  className?: string;
};

export default function Footer({ textColor, className }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const footerTextStyle = textColor ? { color: textColor } : undefined;

  return (
    <footer id="contact" className={className || "border-t border-border bg-background/80"}>
      <div
        className="mx-auto w-full max-w-[1400px] px-10 md:px-16 lg:px-28 py-8 text-sm"
        style={footerTextStyle || {}}
      >
        <div className="flex justify-center items-center">
          <span className={!textColor ? "text-muted-foreground" : ""}>
            © {currentYear} Mihai Pol · Griffith Records ·{" "}
            <Link
              href="https://mihaipol.com"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              mihaipol.com
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
