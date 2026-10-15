"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import AdSlot from "../../components/ad-slot";
import { isVideoSaved, saveVideoToMyList } from "../../lib/supabase/video-saves";

type Movie = {
  id: string;
  slug: string | null;
  title: string;
  category: string;
  creator_name: string | null;
  view_count: number | null;
  description: string | null;
  image: string;
};

const posterImages = [
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
];

const categories = [
  "For you",
  "Nigerian",
  "Action",
  "Drama",
  "Comedy",
  "Romance",
  "Documentary",
];

export default function CinemaPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("For you");
  const [search, setSearch] = useState("");
  const [savedFeaturedMovieId, setSavedFeaturedMovieId] = useState<string | null>(null);
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    async function loadMovies() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("videos")
        .select("id, slug, title, category, creator_name, view_count, description")
        .eq("status", "published")
        .eq("content_type", "film")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        const loadedMovies = (data ?? []).map((movie, index) => ({
          ...movie,
          image: posterImages[index % posterImages.length],
        })) as Movie[];

        setMovies(loadedMovies);
      }

      setLoading(false);
    }

    loadMovies();
  }, []);

  const featuredMovie = movies[0];
  const featuredSaved = featuredMovie?.id === savedFeaturedMovieId;

  useEffect(() => {
    if (!featuredMovie) return;
    let active = true;
    isVideoSaved(featuredMovie.id).then(({ saved }) => {
      if (active) setSavedFeaturedMovieId(saved ? featuredMovie.id : null);
    });
    return () => { active = false; };
  }, [featuredMovie]);

  async function saveFeaturedMovie() {
    if (!featuredMovie || savingFeatured || featuredSaved) return;
    setSavingFeatured(true);
    setSaveMessage("");
    try {
      const error = await saveVideoToMyList(featuredMovie.id);
      if (error) setSaveMessage(`Could not save this video: ${error}`);
      else setSavedFeaturedMovieId(featuredMovie.id);
    } catch {
      setSaveMessage("Could not save this video. Please try again.");
    } finally {
      setSavingFeatured(false);
    }
  }



  const filteredMovies = movies.filter((movie) => {
    const matchesCategory =
      selectedCategory === "For you" ||
      movie.category.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesSearch = `${movie.title} ${movie.category}`
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 bg-black/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-2xl font-black tracking-tight">
            Video<span className="text-red-500">Box</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <Link href="/cinema" className="text-white">Cinema</Link>
            <Link href="/shorts" className="transition hover:text-white">Shorts</Link>
            <Link href="/explore" className="transition hover:text-white">Explore</Link>
          </nav>

          <Link
            href="/login"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Sign in
          </Link>

        </div>


        <nav className="flex gap-5 overflow-x-auto border-t border-white/10 px-5 py-3 text-sm text-white/60 md:hidden">
          <Link href="/" className="shrink-0 hover:text-white">Home</Link>
          <Link href="/shorts" className="shrink-0 hover:text-white">Shorts</Link>
          <Link href="/cinema" className="shrink-0 text-white">Cinema</Link>
          <Link href="/explore" className="shrink-0 hover:text-white">Explore</Link>
          <Link href="/studio" className="shrink-0 hover:text-white">Studio</Link>
          <Link href="/my-list" className="shrink-0 hover:text-white">My List</Link>
        </nav>



      </header>

      <section className="relative isolate min-h-[530px] overflow-hidden">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2000&q=90')",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/75 to-black/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#050505] via-transparent to-black/20" />

        <div className="mx-auto flex min-h-[530px] max-w-7xl items-end px-5 pb-16 pt-24 sm:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Featured premiere
            </div>

            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
              {featuredMovie?.title ?? "Explore Cinema"}
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
              {featuredMovie?.description ||
                "Discover amazing videos and stories from VideoBox creators."}
            </p>

            {featuredMovie && (
              <>
                <div className="mt-5 flex items-center gap-3 text-xs text-white/55 sm:text-sm">
                  <span>{featuredMovie.category}</span>
                  <span>•</span>
                  <span>{featuredMovie.view_count ?? 0} views</span>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/watch/${featuredMovie.slug ?? featuredMovie.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-bold transition hover:bg-red-400"
                  >
                    <span aria-hidden="true">▶</span> Watch now
                  </Link>

                  <button
                    type="button"
                    disabled={savingFeatured || featuredSaved}
                    onClick={saveFeaturedMovie}
                    className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
                  >
                    {savingFeatured ? "Saving…" : featuredSaved ? "✓ Added to my list" : "+ My list"}
                  </button>
                  {saveMessage && <p role="status" className="basis-full text-sm text-white/60">{saveMessage}</p>}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_CINEMA_SLOT} />

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-400">
              Find your next watch
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Explore Cinema</h2>
          </div>

          <label className="flex w-full max-w-xs items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white/40 focus-within:border-red-500/50">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search movies..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="mb-10 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${selectedCategory === category
                ? "bg-white text-black"
                : "border border-white/10 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white"
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold">Trending films</h3>
          <Link href="/explore" className="text-sm text-white/50 transition hover:text-white">
            See all →
          </Link>
        </div>

        {loading ? (
          <p className="text-white/60">Loading movies...</p>
        ) : error ? (
          <p className="rounded-2xl border border-red-500/30 p-6 text-red-300">
            Could not load movies: {error}
          </p>
        ) : filteredMovies.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-8 text-center">
            <p className="font-semibold">No movies found</p>
            <p className="mt-2 text-sm text-white/50">
              Try another search or show all films.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("For you");
                setSearch("");
              }}
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Show all films
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {filteredMovies.map((movie) => (
              <Link
                key={movie.id}
                href={`/watch/${movie.slug ?? movie.id}`}
                className="group"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${movie.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur">
                    {movie.category}
                  </span>
                  <span className="absolute bottom-3 left-3 right-3">
                    <span className="block text-sm font-bold leading-tight">{movie.title}</span>
                    <span className="mt-1 block text-[11px] text-white/55">
                      {movie.creator_name ?? "VideoBox creator"} · {movie.view_count ?? 0} views
                    </span>
                  </span>
                  <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-red-500 text-lg shadow-xl">▶</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-white/35">
        © 2026 VideoBox. Discover something worth watching.
      </footer>
    </main>
  );
}
