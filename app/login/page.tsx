"use client";

import { Suspense, useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { getSafeNextPath, withNextPath } from "../../lib/safe-next-path";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const authError = searchParams.get("error");
  const authMessage = authError === "confirmation"
    ? "That email link is invalid or expired. Enter your email below and choose Resend confirmation email on the sign-up page."
    : authError === "configuration"
      ? "VideoBox sign-in is not configured correctly. Please contact support."
      : "";

  function preserveNext(event: MouseEvent<HTMLAnchorElement>, path: string) {
    const nextPath = getSafeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );
    if (!nextPath) return;
    event.preventDefault();
    router.push(withNextPath(path, nextPath));
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) throw loginError;
      if (!loginData.session || !loginData.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error("Please confirm your email from the newest VideoBox confirmation message before signing in.");
      }

      let isAdmin = false;
      try {
        const adminCheck = await supabase.rpc("is_admin");
        isAdmin = !adminCheck.error && adminCheck.data === true;
      } catch {
        // A failed admin lookup should not block a successful sign-in.
      }

      const nextPath = getSafeNextPath(
        searchParams.get("next"),
      );
      const isAdminPath = nextPath === "/admin" || nextPath?.startsWith("/admin/");

      if (nextPath && (!isAdminPath || isAdmin)) {
        router.replace(nextPath);
      } else if (isAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/");
      }

      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in. Please try again.");
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMessage("Enter your email address first, then choose Forgot password.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const nextPath = getSafeNextPath(
        searchParams.get("next"),
      );
      const resetDestination = withNextPath("/reset-password", nextPath);
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}${withNextPath("/auth/callback", resetDestination)}`,
      });
      if (error) throw error;
      setMessage("If an account uses that email, a password reset link has been sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send a reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          ← Back to VideoBox
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8">
            <div className="text-3xl font-black tracking-tight">
              Video<span className="text-red-500">Box</span>
            </div>

            <h1 className="mt-6 text-3xl font-bold">Welcome back</h1>

            <p className="mt-2 text-white/55">
              Sign in to continue watching and discovering.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-red-500/60"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm text-white/70">Password</label>

                <button
                  type="button"
                  className="text-xs text-white/45 transition hover:text-red-400"
                  onClick={handlePasswordReset}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-red-500/60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-500 px-4 py-3.5 font-semibold transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {(message || authMessage) && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-white/80">
              {message || authMessage}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-white/50">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              onClick={(event) => preserveNext(event, "/signup")}
              className="font-medium text-white transition hover:text-red-400"
            >
              Create account
            </Link>
          </p>

          <nav aria-label="Legal information" className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-white/10 pt-5 text-xs text-white/45">
            <Link href="/privacy" target="_blank" rel="noreferrer" className="hover:text-white">Privacy</Link>
            <Link href="/terms" target="_blank" rel="noreferrer" className="hover:text-white">Terms</Link>
            <Link href="/content-guidelines" target="_blank" rel="noreferrer" className="hover:text-white">Content guidelines</Link>
          </nav>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#050505] text-sm text-white/60">Loading sign in…</main>}>
      <LoginForm />
    </Suspense>
  );
}
