"use client";

export function AdminFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
          <p>
            Powered by <span className="font-semibold text-foreground">Griffith Records</span> © {currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
}
