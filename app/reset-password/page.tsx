"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { getSafeNextPath, withNextPath } from "../../lib/safe-next-path";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setMessage("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMessage("The reset link may have expired. Request a new one from Sign in.");
      return;
    }
    await supabase.auth.signOut();
    const nextPath = getSafeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );
    router.replace(withNextPath("/login", nextPath));
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <Link href="/" className="text-2xl font-black">Video<span className="text-red-500">Box</span></Link>
        <h1 className="mt-8 text-3xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-sm text-white/55">Enter a new password for your VideoBox account.</p>
        <form onSubmit={savePassword} className="mt-6 space-y-4">
          <label className="block text-sm text-white/70">New password
            <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none focus:border-red-500/60" />
          </label>
          <label className="block text-sm text-white/70">Confirm new password
            <input type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none focus:border-red-500/60" />
          </label>
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-red-500 px-4 py-3 font-semibold hover:bg-red-400 disabled:opacity-50">{saving ? "Saving…" : "Update password"}</button>
        </form>
        {message && <p role="status" className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/70">{message}</p>}
        <nav aria-label="Legal information" className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-white/10 pt-5 text-xs text-white/45">
          <Link href="/privacy" target="_blank" rel="noreferrer" className="hover:text-white">Privacy</Link>
          <Link href="/terms" target="_blank" rel="noreferrer" className="hover:text-white">Terms</Link>
          <Link href="/content-guidelines" target="_blank" rel="noreferrer" className="hover:text-white">Content guidelines</Link>
        </nav>
      </div>
    </main>
  );
}
