import type { Metadata } from "next";
import LoginForm from "@/features/auth/components/LoginForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGradient, getCardGradient } from "@/lib/gradient-presets";
import { getAllFontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Login",
};

export default function AdminLoginPage() {
  return (
    <div
      className={`preset-balanced font-sans flex h-screen overflow-hidden flex-col ${getGradient()} ${getAllFontVariables()}`}
    >
      {/* Sparkles decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="sparkle" style={{ top: "20%", left: "10%", animationDelay: "0s" }} />
        <div className="sparkle" style={{ top: "50%", left: "15%", animationDelay: "5s" }} />
        <div className="sparkle" style={{ top: "75%", left: "8%", animationDelay: "10s" }} />
        <div className="sparkle" style={{ top: "30%", right: "12%", animationDelay: "7s" }} />
        <div className="sparkle" style={{ top: "60%", right: "8%", animationDelay: "12s" }} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start md:items-center justify-center px-4 pt-4 pb-8 md:pb-16 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md space-y-4 md:space-y-8 pt-[30px] md:pt-0">
          {/* Header with logo */}
          <div className="text-center space-y-2 md:space-y-4">
            <Link href="/admin" className="inline-block group">
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-bold text-foreground leading-tight uppercase tracking-tight transition-colors group-hover:text-primary">
                  Mihai Pol
                </span>
                <span className="text-xs md:text-sm text-muted-foreground leading-tight -mt-1 font-medium">
                  Artist Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Login card */}
          <div className={`relative overflow-hidden rounded-xl border border-border shadow-lg ${getCardGradient()}`}>
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
            
            {/* Sparkle decorations */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
            <div
              className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
              style={{ animationDelay: "300ms" }}
            />

            <div className="relative p-6 md:p-8 space-y-5 md:space-y-6">
              <header className="space-y-2 text-center">
                <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
                  Admin Access
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Sign in to manage releases
                </h1>
                <p className="text-sm text-muted-foreground">
                  Email + password only. Signups are disabled.
                </p>
              </header>

              <LoginForm />
            </div>
          </div>

          {/* Back to website link */}
          <div className="text-center">
            <Link href="/dev">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to website
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
