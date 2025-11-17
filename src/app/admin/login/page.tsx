import LoginForm from "@/features/auth/components/LoginForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
	return (
		<div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
			<Link href="/dev">
				<Button variant="ghost" size="sm" className="mb-2 -ml-2">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to website
				</Button>
			</Link>
			<header className="space-y-2 text-center">
				<p className="text-sm uppercase tracking-widest text-muted-foreground">Admin Access</p>
				<h1 className="text-3xl font-semibold tracking-tight">Sign in to manage releases</h1>
				<p className="text-sm text-muted-foreground">
					Email + password only. Signups are disabled.
				</p>
			</header>
			<div className="rounded-lg border border-border p-6">
				<LoginForm />
			</div>
		</div>
	);
}
