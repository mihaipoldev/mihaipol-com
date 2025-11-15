export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/80">
      <div className="mx-auto w-full max-w-[1400px] px-10 md:px-16 lg:px-28 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Mihai Pol. All rights reserved.
      </div>
    </footer>
  );
}
