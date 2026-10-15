"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

type Profile = {
  id: string;
  email: string | null;
  created_at: string;
  suspended_at: string | null;
  suspension_reason: string | null;
};

type MoneyEntry = {
  id: string;
  kind: "income" | "expense";
  source: string;
  description: string | null;
  amount: number;
  currency: string;
  created_at: string;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [draftCount, setDraftCount] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

  const [kind, setKind] = useState<"income" | "expense">("income");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      setIsAdmin(false);
      setError("Sign in with your admin account to open this dashboard.");
      setLoading(false);
      return;
    }

    setAdminEmail(user.email ?? "");
    setCurrentUserId(user.id);

    const { data: adminCheck, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || !adminCheck) {
      setIsAdmin(false);
      setError("This account does not have admin access.");
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const [profileResult, moneyResult, draftResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, created_at, suspended_at, suspension_reason")
        .order("created_at", { ascending: false }),
      supabase
        .from("money_entries")
        .select("id, kind, source, description, amount, currency, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
    ]);

    if (profileResult.error || moneyResult.error || draftResult.error) {
      setError(
        profileResult.error?.message ??
        moneyResult.error?.message ??
        draftResult.error?.message ??
        "Could not load dashboard data."
      );
      setLoading(false);
      return;
    }

    setProfiles((profileResult.data ?? []) as Profile[]);
    setEntries((moneyResult.data ?? []) as MoneyEntry[]);
    setDraftCount(draftResult.count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  async function changeSuspension(
    profile: Profile,
    action: "suspend" | "unsuspend"
  ) {
    let reason = "";

    if (action === "suspend") {
      const answer = window.prompt("Why are you suspending this account?");
      if (!answer || answer.trim().length < 3) return;
      reason = answer.trim();
    } else if (!window.confirm(`Restore ${profile.email ?? "this account"}?`)) {
      return;
    }

    setBusyUserId(profile.id);
    setNotice("");
    setError("");

    try {

      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Please sign in again.");
      }


      const response = await fetch(
        `/api/admin/users/${profile.id}/suspension`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action, reason }),
        }
      );

      const responseText = await response.text();




      let result: { error?: string } | null = null;

      try {
        result = JSON.parse(responseText) as { error?: string };
      } catch {
        // The response wasn't JSON.
      }

      if (!response.ok) {
        throw new Error(result?.error ?? "Could not update this account.");
      }

      setNotice(
        action === "suspend" ? "Account suspended." : "Account restored."
      );
      await loadDashboard();



    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update this account."
      );
    } finally {
      setBusyUserId("");
    }
  }

  async function saveMoneyEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");

    const numericAmount = Number(amount);

    if (!source.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a source and an amount greater than zero.");
      return;
    }

    const supabase = createClient();
    const { error: saveError } = await supabase.from("money_entries").insert({
      kind,
      source: source.trim(),
      description: description.trim(),
      amount: numericAmount,
      currency,
    });

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setNotice("Money entry recorded.");
    setSource("");
    setDescription("");
    setAmount("");
    await loadDashboard();
  }

  function moneyTotal(entryKind: "income" | "expense") {
    const totals: Record<string, number> = {};

    for (const entry of entries) {
      if (entry.kind === entryKind) {
        const code = entry.currency || "USD";
        totals[code] = (totals[code] ?? 0) + Number(entry.amount);
      }
    }

    const formatted = Object.entries(totals).map(
      ([code, total]) =>
        `${code} ${total.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
    );

    return formatted.length > 0 ? formatted.join(" · ") : "—";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] p-8 text-white">
        Loading admin dashboard...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050505] p-8 text-white">
        <p>{error || "Admin access required."}</p>
        <Link href="/login" className="mt-4 inline-block underline">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-2xl font-black">
              Video<span className="text-red-500">Box</span>
            </Link>
            <h1 className="mt-6 text-3xl font-black">Admin dashboard</h1>
            <p className="mt-1 text-sm text-white/50">
              Signed in as {adminEmail}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/videos"
              className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
            >
              Review videos ({draftCount})
            </Link>
            <Link
              href="/admin/reports"
              className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
            >
              Review reports
            </Link>
            <Link
              href="/"
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black"
            >
              View app
            </Link>
          </div>
        </header>

        {(error || notice) && (
          <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
            {error || notice}
          </p>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-white/50">Registered users</p>
            <p className="mt-2 text-3xl font-black">{profiles.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-white/50">Suspended accounts</p>
            <p className="mt-2 text-3xl font-black">
              {profiles.filter((profile) => profile.suspended_at).length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-white/50">Recorded income</p>
            <p className="mt-2 text-lg font-black">{moneyTotal("income")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-white/50">Recorded expenses</p>
            <p className="mt-2 text-lg font-black">{moneyTotal("expense")}</p>
          </div>
        </section>

        <p className="mt-3 text-xs text-white/40">
          Money totals are entries you record manually. They aren’t live ad
          earnings or money available to withdraw.
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">Record money</h2>
          <form
            onSubmit={saveMoneyEntry}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as "income" | "expense")
              }
              className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              maxLength={100}
              placeholder="Source, e.g. sponsorship"
              required
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white"
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Amount"
              required
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white"
            />
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white"
            >
              <option value="USD">USD</option>
              <option value="NGN">NGN</option>
            </select>
            <button className="rounded-xl bg-red-500 px-4 py-3 text-sm font-bold hover:bg-red-400">
              Add entry
            </button>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              placeholder="Description (optional)"
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white sm:col-span-2 lg:col-span-5"
            />
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">Users</h2>

          {profiles.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">No users found.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {profiles.map((profile) => (
                <article
                  key={profile.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"
                >
                  <div>
                    <p>{profile.email ?? "No email available"}</p>
                    <p className="mt-1 text-xs text-white/40">
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                      {profile.suspended_at
                        ? ` · Suspended: ${profile.suspension_reason ?? "No reason given"}`
                        : ""}
                    </p>
                  </div>

                  {profile.id === currentUserId ? (
                    <span className="text-xs text-white/40">Admin account</span>
                  ) : profile.suspended_at ? (
                    <button
                      type="button"
                      disabled={busyUserId === profile.id}
                      onClick={() => changeSuspension(profile, "unsuspend")}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                    >
                      Restore account
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyUserId === profile.id}
                      onClick={() => changeSuspension(profile, "suspend")}
                      className="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Suspend account
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">Recent money entries</h2>

          {entries.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">
              No entries recorded yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {entries.slice(0, 20).map((entry) => (
                <article
                  key={entry.id}
                  className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-3"
                >
                  <span>
                    {entry.kind === "income" ? "Income" : "Expense"} · {entry.source}
                    {entry.description ? ` · ${entry.description}` : ""}
                  </span>
                  <span>
                    {entry.currency} {Number(entry.amount).toFixed(2)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
