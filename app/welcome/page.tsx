import type { Metadata } from "next";
import Link from "next/link";
import { getSafeNextPath, withNextPath } from "../../lib/safe-next-path";

export const metadata: Metadata = {
  title: "Welcome to VideoBox",
  description:
    "Discover Nigerian films, action stories, and creator-made shorts on VideoBox.",
};

export default async function WelcomePage({
  searchParams,
}: PageProps<"/welcome">) {
  const query = await searchParams;
  const requestedNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const nextPath = getSafeNextPath(requestedNext);

  return (
    <main className="min-h-screen overflow-hidden bg-[#080808] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(ellipse_at_68%_28%,rgba(190,24,93,0.18),transparent_45%),radial-gradient(ellipse_at_20%_10%,rgba(239,68,68,0.12),transparent_38%)]"
      />

      <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/welcome"
          aria-label="VideoBox welcome"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-lg font-black shadow-lg shadow-red-950/40">
            V
          </span>
          <span className="text-xl font-bold tracking-tight">
            Video<span className="text-red-400">Box</span>
          </span>
        </Link>

        <nav aria-label="Account" className="flex items-center gap-3">
          <Link
            href={withNextPath("/login", nextPath)}
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Log in
          </Link>
          <Link
            href={withNextPath("/signup", nextPath)}
            className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl items-center gap-12 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24">
        <div className="relative z-10 max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-400/[0.07] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-200">
            <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.8)]" />
            Your screen. Your stories.
          </p>

          <h1 className="mt-7 text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Stories worth
            <br />
            staying up for.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
            Find your next favorite film, catch a quick Short, and discover
            original voices from creators in Nigeria and around the world.
          </p>

          <div className="mt-9 flex flex-col gap-3 min-[420px]:flex-row">
            <Link
              href={withNextPath("/signup", nextPath)}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-7 py-3 font-bold shadow-xl shadow-red-950/30 transition hover:-translate-y-0.5 hover:from-red-400 hover:to-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Create your free account
              <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <Link
              href={withNextPath("/login", nextPath)}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Log in
            </Link>
          </div>

          <p className="mt-5 text-xs leading-5 text-white/40">
            Sign in or create an account to enter VideoBox and start watching.
          </p>

          <div className="mt-10 flex flex-wrap gap-2" aria-label="Explore genres">
            {["Nigerian films", "Action", "Comedy", "Creator Shorts"].map(
              (genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/55"
                >
                  {genre}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-red-500/20 via-purple-500/10 to-transparent blur-2xl"
          />
          <div className="relative aspect-[4/4.5] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-zinc-900 via-purple-950/70 to-black shadow-2xl sm:aspect-[5/4] lg:aspect-[4/4.5]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-[center_38%] opacity-80"
              style={{ backgroundImage: "url('/videos/video3.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <span className="inline-flex rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75 backdrop-blur">
                Meet your next watch
              </span>
              <p className="mt-4 max-w-sm text-2xl font-bold leading-tight sm:text-3xl">
                A home for films, shorts, and fresh perspectives.
              </p>
            </div>
            <div className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/30 text-lg backdrop-blur">
              <span aria-hidden="true">▶</span>
              <span className="sr-only">VideoBox preview artwork</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.07] px-5 py-6 text-center text-xs text-white/40 sm:px-8">
        <p>© 2026 VideoBox. Watch what you love. Discover something new.</p>
        <nav aria-label="Legal" className="mt-3 flex justify-center gap-5">
          <Link href="/privacy" className="transition hover:text-white/75">Privacy</Link>
          <Link href="/terms" className="transition hover:text-white/75">Terms</Link>
          <Link href="/content-guidelines" className="transition hover:text-white/75">Content guidelines</Link>
        </nav>
        <p className="mt-3">Support: <a className="transition hover:text-white/75" href="mailto:gooroo@gmail.com">gooroo@gmail.com</a> · <a className="transition hover:text-white/75" href="tel:09060129459">09060129459</a></p>
      </footer>
    </main>
  );
}
