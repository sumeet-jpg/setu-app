// @ts-nocheck
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-xl font-bold text-primary-foreground">S</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Setu Admin</h1>
          <p className="text-sm text-muted-foreground">
            AI Operations Control Plane
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">
              {error === "unauthorized"
                ? "Access denied. Admin credentials required."
                : "Authentication failed. Please try again."}
            </p>
          </div>
        )}

        <LoginForm redirectTo={redirect} />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          This is a restricted admin console.
          <br />
          Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
}