"use client";

import { FormEvent, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { getSafeNextPath, withNextPath } from "../../lib/safe-next-path";
export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);




  const [resending, setResending] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [ageGatePassed, setAgeGatePassed] = useState(false);
  const [ageError, setAgeError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [existingAccount, setExistingAccount] = useState(false);
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  function requestedNextPath() {
    return getSafeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );
  }

  function preserveNext(event: MouseEvent<HTMLAnchorElement>, path: string) {
    const nextPath = requestedNextPath();
    if (!nextPath) return;
    event.preventDefault();
    router.push(withNextPath(path, nextPath));
  }

  useEffect(() => {
    let cancelled = false;
    async function checkExistingAccount() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) return;
        setExistingAccount(true);
        const hasAdultConfirmation = user.user_metadata?.age_gate === "18_plus_self_attested";
        const hasCurrentPolicies =
          user.user_metadata?.policy_acceptance_version === "videobox-2026-10-07-v1";
        if (hasAdultConfirmation) {
          setAgeGatePassed(true);
        }
        if (hasAdultConfirmation && hasCurrentPolicies) {
          router.replace(requestedNextPath() ?? "/");
        }
      } catch {
        if (!cancelled) {
          setSessionCheckFailed(true);
          setMessage("Could not check your sign-in. Refresh this page and try again.");
        }
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }
    void checkExistingAccount();
    return () => { cancelled = true; };
  }, [router]);

  function continueAfterAgeCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAgeError("");

    const [year, month, day] = birthDate.split("-").map(Number);
    const enteredDate = new Date(year, month - 1, day);
    if (
      !birthDate ||
      !year ||
      !month ||
      !day ||
      enteredDate.getFullYear() !== year ||
      enteredDate.getMonth() !== month - 1 ||
      enteredDate.getDate() !== day
    ) {
      setAgeError("Enter a valid birth date to continue.");
      return;
    }

    const today = new Date();
    const turnedEighteen =
      today.getFullYear() - year -
      (today.getMonth() + 1 < month ||
      (today.getMonth() + 1 === month && today.getDate() < day)
        ? 1
        : 0);

    if (turnedEighteen < 18) {
      setAgeError("VideoBox is currently limited to people aged 18 or older.");
      return;
    }

    setBirthDate("");
    setAgeGatePassed(true);
  }

  async function confirmExistingAccount() {
    if (!acceptedPolicies) {
      setMessage("Read and accept the Terms of Use and Privacy Notice before continuing.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          age_gate: "18_plus_self_attested",
          policy_acceptance_version: "videobox-2026-10-07-v1",
        },
      });
      if (error) throw error;
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      router.replace(requestedNextPath() ?? "/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your account.");
    } finally {
      setLoading(false);
    }
  }

  async function leavePolicyReview() {
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/welcome");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setLoading(false);
    }
  }





  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acceptedPolicies) {
      setMessage("Read and accept the Terms of Use and Privacy Notice before creating an account.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient();
      const nextPath = requestedNextPath();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${withNextPath("/auth/callback", nextPath)}`,
          data: {
            display_name: displayName.trim(),
            username: username.trim(),
            age_gate: "18_plus_self_attested",
            policy_acceptance_version: "videobox-2026-10-07-v1",
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        setMessage(
          "Supabase is allowing signup without email confirmation, so this account received a login session. I signed it out. In Supabase, turn on Authentication → Sign In / Providers → Email → Confirm email, then test signup with a new email address."
        );
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (sessionData.session) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      }

      setMessage("Account created. Check your email to confirm it. You are signed out until you confirm and sign in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the account. Please try again.");
    } finally {
      setLoading(false);
    }
  }






  async function handleResendConfirmation() {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setMessage("Enter your email address first.");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}${withNextPath("/auth/callback", requestedNextPath())}`,
        },
      });

      if (error) {
        setMessage(`Could not resend the email: ${error.message}`);
      } else {
        setMessage(
          "A fresh confirmation email was sent. Open the newest email and click its link once."
        );
      }
    } catch {
      setMessage("Could not resend the email. Please try again.");
    } finally {
      setResending(false);
    }
  }






  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 py-12 text-white">
      <div className="w-full max-w-md">

        {/* Back to Home */}
        {existingAccount ? (
          <button
            type="button"
            onClick={leavePolicyReview}
            disabled={loading}
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white disabled:opacity-50"
          >
            ← Sign out and leave
          </button>
        ) : (
          <Link
            href="/welcome"
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            ← Back to VideoBox
          </Link>
        )}

        {/* Signup Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">

          {/* Logo */}
          <div className="mb-8">
            <div className="text-3xl font-black tracking-tight">
              Video<span className="text-red-500">Box</span>
            </div>

            <h1 className="mt-6 text-3xl font-bold">
              {existingAccount
                ? ageGatePassed ? "Review VideoBox policies" : "Confirm adult access"
                : "Create your account"}
            </h1>

            <p className="mt-2 text-white/55">
              This first release is for people aged 18 or older.
            </p>
          </div>

          {checkingSession ? (
            <p className="text-sm text-white/60">Checking your account…</p>
          ) : sessionCheckFailed ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-xl border border-white/15 px-4 py-3 text-sm hover:bg-white/10"
            >
              Refresh and try again
            </button>
          ) : !ageGatePassed ? (
            <form onSubmit={continueAfterAgeCheck} className="space-y-4">
              <div>
                <label htmlFor="birth-date" className="mb-2 block text-sm text-white/70">
                  Birth date
                </label>
                <input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none focus:border-red-500/60"
                />
              </div>
              <p className="text-xs leading-5 text-white/45">
                This check does not save your birth date. VideoBox is currently for adults aged 18 or older; local law may require an older age. Children’s access may be added later with parent safeguards.
              </p>
              {ageError && <p role="alert" className="text-sm text-red-300">{ageError}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-red-500 px-4 py-3.5 font-semibold transition hover:bg-red-400"
              >
                Continue
              </button>
            </form>
          ) : existingAccount ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-white/60">
                By continuing, you confirm that you are at least 18. Your birth date is not saved.
              </p>
              <p className="text-xs leading-5 text-white/45">
                Review the Terms and Privacy Notice, then check the box to enable Continue.
              </p>
              <div className="flex items-start gap-3">
                <input
                  id="accept-policies-existing"
                  type="checkbox"
                  checked={acceptedPolicies}
                  onChange={(event) => setAcceptedPolicies(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-red-500"
                />
                <label htmlFor="accept-policies-existing" className="text-sm leading-6 text-white/60">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" rel="noreferrer" className="text-white underline hover:text-red-300">Terms of Use</Link>
                  {" "}and have read the{" "}
                  <Link href="/privacy" target="_blank" rel="noreferrer" className="text-white underline hover:text-red-300">Privacy Notice</Link>.
                </label>
              </div>
              <button
                type="button"
                onClick={confirmExistingAccount}
                disabled={loading || !acceptedPolicies}
                className="w-full rounded-xl bg-red-500 px-4 py-3.5 font-semibold transition hover:bg-red-400 disabled:opacity-50"
              >
                {loading ? "Confirming…" : "I am 18 or older — continue"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgeGatePassed(false);
                  setBirthDate("");
                  setAgeError("");
                  setAcceptedPolicies(false);
                  setMessage("");
                }}
                disabled={loading}
                className="w-full rounded-xl border border-white/15 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10 disabled:opacity-50"
              >
                Back to age check
              </button>
            </div>
          ) : (
          <form onSubmit={handleSignup} className="space-y-4">

            {/* Display Name */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Display name
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 outline-none transition placeholder:text-white/30 focus:border-red-500/60"
              />
            </div>

            {/* Username */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@yourusername"
                required
                minLength={3}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 outline-none transition placeholder:text-white/30 focus:border-red-500/60"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 outline-none transition placeholder:text-white/30 focus:border-red-500/60"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={8}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 outline-none transition placeholder:text-white/30 focus:border-red-500/60"
              />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                id="accept-policies"
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(event) => setAcceptedPolicies(event.target.checked)}
                required
                className="mt-1 h-4 w-4 accent-red-500"
              />
              <label htmlFor="accept-policies" className="text-sm leading-6 text-white/60">
                I agree to the{" "}
                <Link href="/terms" target="_blank" rel="noreferrer" className="text-white underline hover:text-red-300">Terms of Use</Link>
                {" "}and have read the{" "}
                <Link href="/privacy" target="_blank" rel="noreferrer" className="text-white underline hover:text-red-300">Privacy Notice</Link>.
              </label>
            </div>

            {/* Create Account */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-500 px-4 py-3.5 font-semibold transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

          </form>
          )}

          {/* Message */}
          {message && (
            <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-white/80">
              {message}
            </div>
          )}






          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={!email.trim() || resending}
            className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 text-sm text-white/75 hover:bg-white/10 disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend confirmation email"}
          </button>






          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href="/login"
              onClick={(event) => preserveNext(event, "/login")}
              className="font-medium text-white transition hover:text-red-400"
            >
              Sign in
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
