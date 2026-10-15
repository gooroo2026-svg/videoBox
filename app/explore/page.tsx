"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type ExploreVideo = {
  id: string;
  slug: string | null;
  title: string;
  creator_name: string | null;
  category: string | null;
  view_count: number | null;
  color: string;
};

const categories = [
  "All",
  "Nigerian",
  "Action",
  "Drama",
  "Comedy",
  "Romance",
  "Documentary",
];

function getVideoColor(category: string) {
  switch (category.toLowerCase()) {
    case "action":
      return "from-red-700 to-slate-950";
    case "drama":
      return "from-purple-700 to-slate-950";
    case "comedy":
      return "from-yellow-600 to-red-950";
    case "documentary":
      return "from-indigo-700 to-slate-950";
    case "nigerian":
      return "from-teal-600 to-blue-950";
    default:
      return "from-orange-600 to-amber-950";
  }
}

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [videos, setVideos] = useState<ExploreVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVideos() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("videos")
        .select("id, slug, title, creator_name, category, view_count")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setVideos(
          (data ?? []).map((video) => ({
            ...video,
            color: getVideoColor(video.category ?? ""),
          })) as ExploreVideo[]
        );
      }

      setLoading(false);
    }

    loadVideos();
  }, []);

  const filteredVideos = useMemo(
    () =>
      videos.filter((video) => {
        const matchesCategory =
          category === "All" ||
          (video.category ?? "").toLowerCase() === category.toLowerCase();

        const matchesSearch =
          `${video.title} ${video.creator_name ?? ""} ${video.category ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase());

        return matchesCategory && matchesSearch;
      }),
    [videos, search, category]
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 bg-black/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black">
            Video<span className="text-red-500">Box</span>
          </Link>
          <nav className="flex gap-5 text-sm text-white/65">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/cinema" className="hover:text-white">Cinema</Link>
            <Link href="/shorts" className="hover:text-white">Shorts</Link>
            <Link href="/explore" className="text-white">Explore</Link>
          </nav>
          <Link
            href="/login"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
          Find something new
        </p>
        <h1 className="mt-2 text-4xl font-black">Explore VideoBox</h1>
        <p className="mt-3 max-w-xl text-white/55">
          Search videos and browse stories from creators across VideoBox.
        </p>

        <label className="mt-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 focus-within:border-red-500/50">
          <span className="text-xl text-white/40">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search videos, creators, or topics..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
          />
        </label>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${category === item
                ? "bg-white text-black"
                : "border border-white/10 bg-white/[0.04] text-white/65 hover:text-white"
                }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">Videos to explore</h2>
          <span className="text-sm text-white/40">
            {loading ? "Loading..." : `${filteredVideos.length} results`}
          </span>
        </div>

        {loading ? (
          <p className="mt-10 rounded-2xl border border-white/10 p-8 text-center text-white/50">
            Loading videos...
          </p>
        ) : error ? (
          <p className="mt-10 rounded-2xl border border-red-500/30 p-8 text-center text-red-300">
            Could not load videos: {error}
          </p>
        ) : filteredVideos.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video) => (
              <Link
                key={video.id}
                href={`/watch/${video.slug ?? video.id}`}
                className="group"
              >
                <div
                  className={`relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br ${video.color}`}
                >
                  <div className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/0">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-xl backdrop-blur">
                      ▶
                    </span>
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs">
                    {video.category ?? "Video"}
                  </span>
                </div>
                <h3 className="mt-3 font-bold group-hover:text-red-300">
                  {video.title}
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  {video.creator_name ?? "VideoBox creator"} · {video.view_count ?? 0} views
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-10 rounded-2xl border border-white/10 p-8 text-center text-white/50">
            No videos found. Try another search or category.
          </p>
        )}
      </section>
    </main>
  );
}