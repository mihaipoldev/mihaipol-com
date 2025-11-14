export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Admin Access</p>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to manage releases</h1>
        <p className="text-sm text-muted-foreground">
          Authentication flows are coming soon. Hang tight.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Placeholder login form
      </div>
    </div>
  );
}
