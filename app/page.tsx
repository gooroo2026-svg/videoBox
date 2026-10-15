"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";
import AdSlot from "../components/ad-slot";
import VideoLikeButton from "../components/video-like-button";
import { isVideoSaved, saveVideoToMyList } from "../lib/supabase/video-saves";

const categories = [
  "All",
  "Trending",
  "Nigerian",
  "Action",
  "Comedy",
  "Drama",
  "Romance",
  "Documentary",
  "Music",
  "Sports",
];

type Video = {
  id: string;
  slug: string | null;
  content_type: "film" | "short";
  title: string;
  category: string;
  creator_name: string | null;
  view_count: number | null;
  cloud_url: string;
};

const categoryColors: Record<string, string> = {
  Nigerian: "from-purple-900 via-indigo-800 to-slate-950",
  Drama: "from-blue-900 via-cyan-800 to-slate-950",
  Comedy: "from-orange-900 via-red-800 to-slate-950",
  Action: "from-slate-800 via-zinc-700 to-black",
};

function getVideoColor(category: string) {
  return categoryColors[category] ?? "from-zinc-800 via-slate-800 to-black";
}




export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [savedFeaturedVideoId, setSavedFeaturedVideoId] = useState<string | null>(null);
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");



  const [videos, setVideos] = useState<Video[]>([]);
  const [continueWatchingVideos, setContinueWatchingVideos] = useState<Video[]>([]);
  const [clearingWatchHistory, setClearingWatchHistory] = useState(false);
  const [watchHistoryMessage, setWatchHistoryMessage] = useState("");
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState("");

  useEffect(() => {
    async function loadVideos() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("videos")
        .select("id, slug, content_type, title, category, creator_name, view_count, cloud_url")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load videos:", error.message);
        setVideosError(error.message);
      } else {
        setVideos((data ?? []) as Video[]);
        setVideosError("");
      }

      setVideosLoading(false);
    }

    loadVideos();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadWatchHistory() {
      if (!videos.length) return;
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        if (active) setContinueWatchingVideos([]);
        return;
      }
      const { data: history, error } = await supabase
        .from("watch_history")
        .select("video_id, updated_at")
        .eq("user_id", authData.user.id)
        .eq("completed", false)
        .order("updated_at", { ascending: false })
        .limit(12);
      if (error || !history?.length) {
        if (active) setContinueWatchingVideos([]);
        return;
      }
      const byId = new Map(videos.map((video) => [video.id, video]));
      const ordered = history
        .map((item) => byId.get(item.video_id))
        .filter((video): video is Video => video !== undefined && video.content_type !== "short")
        .slice(0, 3);
      if (active) setContinueWatchingVideos(ordered);
    }
    void loadWatchHistory();
    return () => { active = false; };
  }, [videos]);

  const matchingVideos = videos.filter(
    (video) =>
      video.content_type !== "short" &&
      (activeCategory === "All" ||
      activeCategory === "Trending" ||
      video.category === activeCategory)
  );
  const filteredVideos = activeCategory === "Trending"
    ? [...matchingVideos].sort(
        (first, second) => (second.view_count ?? 0) - (first.view_count ?? 0)
      )
    : matchingVideos;

  const featuredVideo = videos.find((video) => video.content_type !== "short") ?? null;
  const shorts = videos.filter((video) => video.content_type === "short").slice(0, 4);
  const recommendedVideos = filteredVideos.slice(0, 4);
  const nigerianHighlights = videos.filter((video) => video.category === "Nigerian").slice(0, 4);
  const inMyList = featuredVideo?.id === savedFeaturedVideoId;
  useEffect(() => {
    if (!featuredVideo) return;
    let active = true;
    isVideoSaved(featuredVideo.id).then(({ saved }) => {
      if (active) setSavedFeaturedVideoId(saved ? featuredVideo.id : null);
    });
    return () => { active = false; };
  }, [featuredVideo]);

  async function saveFeaturedVideo() {
    if (!featuredVideo || savingFeatured || inMyList) return;
    setSavingFeatured(true);
    setSaveMessage("");
    try {
      const error = await saveVideoToMyList(featuredVideo.id);
      if (error) setSaveMessage(`Could not save this video: ${error}`);
      else setSavedFeaturedVideoId(featuredVideo.id);
    } catch {
      setSaveMessage("Could not save this video. Please try again.");
    } finally {
      setSavingFeatured(false);
    }
  }

  async function clearWatchHistory() {
    if (clearingWatchHistory || !window.confirm("Clear your watch history? This cannot be undone.")) return;
    setClearingWatchHistory(true);
    setWatchHistoryMessage("");
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setWatchHistoryMessage("Please sign in again to clear your history.");
      setClearingWatchHistory(false);
      return;
    }
    const { error } = await supabase
      .from("watch_history")
      .delete()
      .eq("user_id", authData.user.id);
    if (error) {
      setWatchHistoryMessage("Could not clear watch history. Please try again.");
    } else {
      setContinueWatchingVideos([]);
      setWatchHistoryMessage("Watch history cleared.");
    }
    setClearingWatchHistory(false);
  }

  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) {
        setUserEmail(data.user?.email ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (!error) {
      setUserEmail(null);
    }
  }











  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-lg font-black">
              V
            </div>
            <span className="text-xl font-bold tracking-tight">
              Video<span className="text-red-500">Box</span>
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
            <a className="text-white" href="#">
              Home
            </a>
            <a className="transition hover:text-white" href="/shorts">
              Shorts
            </a>
            <a className="transition hover:text-white" href="/cinema">
              Cinema
            </a>
            <a className="transition hover:text-white" href="/explore">
              Explore
            </a>
            <Link href="/studio">Creator Studio</Link>
            <Link href="/my-list" className="transition hover:text-white">
              My List
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">

            <Link
              href="/explore"
              className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 sm:block"
            >
              🔎 Search
            </Link>


            {userEmail ? (
              <>
                <span className="hidden max-w-[180px] truncate text-xs text-white/50 sm:block">
                  {userEmail}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 sm:block"
                >
                  Sign in
                </Link>
                <Link
                  href="/login"
                  aria-label="Open account"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                >
                  👤
                </Link>
              </>
            )}




          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-white/10 px-4 py-3 text-sm text-white/60 md:hidden">
          <Link href="/" className="shrink-0 text-white">Home</Link>
          <Link href="/shorts" className="shrink-0 hover:text-white">Shorts</Link>
          <Link href="/cinema" className="shrink-0 hover:text-white">Cinema</Link>
          <Link href="/explore" className="shrink-0 hover:text-white">Explore</Link>
          <Link href="/studio" className="shrink-0 hover:text-white">Studio</Link>
          <Link href="/my-list" className="transition hover:text-white">
            My List
          </Link>
        </nav>

      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/40 via-purple-950/20 to-transparent" />

        <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-end px-4 pb-16 sm:px-6">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
              🔥 Featured on VideoBox
            </div>

            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
              Watch.
              <br />
              Discover.
              <br />
              <span className="bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent">
                Connect.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
              Discover amazing shorts, movies and stories from creators around
              the world—all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={featuredVideo ? `/watch/${featuredVideo.slug || featuredVideo.id}` : "/explore"}
                className="rounded-full bg-white px-6 py-3 font-bold text-black transition hover:scale-105"
              >
                {featuredVideo ? "▶ Watch now" : "Explore videos"}
              </Link>

              <button
                type="button"
                disabled={!featuredVideo || savingFeatured || inMyList}
                onClick={saveFeaturedVideo}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/10"
              >
                {savingFeatured ? "Saving…" : inMyList ? "✓ In My List" : "+ My list"}
              </button>
              {saveMessage && <p role="status" className="basis-full text-sm text-white/60">{saveMessage}</p>}
            </div>
          </div>

          <div className="ml-auto hidden w-full max-w-md lg:block">
            {featuredVideo ? (
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-3 shadow-2xl">
                <div className={`relative aspect-[4/5] overflow-hidden rounded-[22px] bg-gradient-to-br ${getVideoColor(featuredVideo.category)}`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 backdrop-blur">
                    {featuredVideo.category}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-2xl font-black">{featuredVideo.title}</p>
                    <p className="mt-2 text-sm text-white/70">
                      {featuredVideo.creator_name ?? "VideoBox creator"} · {featuredVideo.view_count ?? 0} views
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-white/50">
                No featured video is available yet. Published content will appear here.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-5 [scrollbar-width:none]">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${activeCategory === category
                ? "bg-white text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* TRENDING */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
              {activeCategory === "Trending" ? "Ranked by published view counts" : "Recently published"}
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl">
              {activeCategory === "Trending" ? "Most viewed on VideoBox" : "Latest from creators"}
            </h2>
          </div>

          <Link
            href="/explore"
            className="text-sm text-white/50 transition hover:text-white"
          >
            View all →
          </Link>


        </div>

        {videosLoading ? (
          <p className="rounded-2xl border border-white/10 p-6 text-white/50">
            Loading videos...
          </p>
        ) : videosError ? (
          <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
            <p className="font-semibold text-red-100">Published videos could not be loaded.</p>
            <p className="mt-2 text-sm text-white/55">{videosError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              Try again
            </button>
          </div>
        ) : filteredVideos.length === 0 ? (
          <p className="rounded-2xl border border-white/10 p-6 text-white/50">
            No videos in this category yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video) => {



              const videoUrl = `/watch/${video.slug ?? video.id}`;



              return (
                <article key={video.id} className="group">
                  <Link
                    href={videoUrl}
                    aria-label={`Watch ${video.title}`}
                    className={`relative block aspect-video overflow-hidden rounded-2xl bg-gradient-to-br ${getVideoColor(video.category)} shadow-2xl`}
                  >
                    <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/5" />

                    <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium backdrop-blur">
                      {video.category}
                    </div>



                    <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-xl transition duration-300 group-hover:scale-110 group-hover:opacity-100">
                      ▶
                    </span>
                  </Link>

                  <div className="mt-3 flex gap-3">
                    <Link href={videoUrl} className="flex min-w-0 flex-1 gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-purple-600 text-sm font-bold">
                        {(video.creator_name ?? "V").charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{video.title}</h3>
                        <p className="mt-1 text-sm text-white/45">
                          {video.creator_name ?? "VideoBox creator"} · {video.view_count ?? 0} views
                        </p>
                      </div>
                    </Link>

                    <VideoLikeButton videoId={video.id} />

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </section>

      {!videosLoading && videos.length === 0 && (
        <section
          aria-labelledby="sample-preview-heading"
          className="mx-auto max-w-7xl px-4 pb-8 sm:px-6"
        >
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-[#111018] to-black p-5 sm:p-8">
            <div className="grid items-center gap-7 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                  Bundled sample · not a creator upload
                </p>
                <h2 id="sample-preview-heading" className="mt-3 text-2xl font-black sm:text-3xl">
                  Get a feel for the VideoBox player
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
                  This locally bundled clip is only a product preview. Published creator videos will appear in the feed when available.
                </p>
                <Link
                  href="/studio"
                  className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90"
                >
                  Upload a video
                </Link>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                <video
                  className="aspect-video w-full object-cover"
                  controls
                  playsInline
                  preload="none"
                  poster="/videos/video1.jpg"
                  aria-label="Bundled VideoBox sample preview"
                >
                  <source src="/videos/vid1.mp4" type="video/mp4" />
                  Your browser does not support video playback.
                </video>
                <p className="px-4 py-3 text-xs text-white/45">
                  Sample preview · Play only when you choose
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {(continueWatchingVideos.length > 0 || watchHistoryMessage) && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {continueWatchingVideos.length > 0 && <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Continue watching
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl">Pick up where you left off</h2>
            </div>
            {continueWatchingVideos.length > 0 && (
              <button type="button" onClick={clearWatchHistory} disabled={clearingWatchHistory} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/65 hover:bg-white/10 disabled:opacity-50">
                {clearingWatchHistory ? "Clearing…" : "Clear history"}
              </button>
            )}
          </div>}
          {watchHistoryMessage && <p role="status" className="mb-4 text-sm text-white/60">{watchHistoryMessage}</p>}
          {continueWatchingVideos.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {continueWatchingVideos.map((video) => (
              <Link key={video.id} href={`/watch/${video.slug ?? video.id}`} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20">
                <div className={`relative mb-3 aspect-video overflow-hidden rounded-xl bg-gradient-to-br ${getVideoColor(video.category)}`}>
                  <div className="absolute inset-0 bg-black/15" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
                    {video.category}
                  </div>
                </div>
                <p className="font-semibold">{video.title}</p>
                <p className="mt-1 text-sm text-white/45">{video.creator_name ?? "VideoBox creator"}</p>
              </Link>
            ))}
          </div>}
        </section>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
              Personal recommendations
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl">Recommended for you</h2>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recommendedVideos.map((video) => (
            <Link key={video.id} href={`/watch/${video.slug ?? video.id}`} className="group block">
              <div className={`relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br ${getVideoColor(video.category)}`}>
                <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/5" />
                <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
                  {video.category}
                </div>
              </div>
              <h3 className="mt-3 truncate font-semibold">{video.title}</h3>
              <p className="mt-1 text-sm text-white/45">{video.creator_name ?? "VideoBox creator"}</p>
            </Link>
          ))}
        </div>
      </section>

      {nigerianHighlights.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                Nigerian cinema
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl">Featured stories from Nigeria</h2>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {nigerianHighlights.map((video) => (
              <Link key={video.id} href={`/watch/${video.slug ?? video.id}`} className="group block">
                <div className={`relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br ${getVideoColor(video.category)}`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
                    {video.category}
                  </div>
                </div>
                <h3 className="mt-3 font-semibold">{video.title}</h3>
                <p className="text-sm text-white/45">{video.creator_name ?? "VideoBox creator"}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SHORTS */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Quick entertainment
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl">🔥 Shorts</h2>
          </div>

          <Link
            href="/shorts"
            className="text-sm text-white/50 transition hover:text-white"
          >
            See all →
          </Link>


        </div>

        {shorts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-6 text-sm text-white/50">
            No Shorts have been published yet. Upload one from Creator Studio.
            <Link href="/studio" className="ml-2 text-red-300 underline">Open Studio</Link>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none]">
            {shorts.map((short, index) => (

            <Link
              href={`/watch/${short.slug ?? short.id}`}
              key={short.id}
              className="group relative block min-w-[180px] overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 sm:min-w-[210px]"
            >
              <div
                className={`aspect-[9/14] bg-gradient-to-br ${[
                  "from-fuchsia-900 to-purple-950",
                  "from-cyan-900 to-blue-950",
                  "from-orange-900 to-red-950",
                  "from-emerald-900 to-teal-950",
                ][index]
                  }`}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

              <div className="absolute bottom-0 p-4">
                <p className="text-sm font-semibold leading-5">{short.title}</p>
                <p className="mt-2 text-xs text-white/50">
                  {short.creator_name ?? "VideoBox creator"} · {short.view_count ?? 0} views
                </p>
              </div>

              <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs backdrop-blur">
                ▶
              </div>
            </Link>
            ))}
          </div>
        )}
      </section>

      {/* CREATOR CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-950/60 via-purple-950/40 to-zinc-950 p-8 sm:p-12">
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
              For creators
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-5xl">
              Your story deserves an audience.
            </h2>

            <p className="mt-4 text-white/60">
              Upload your videos, build your audience, connect with viewers and
              grow your creator journey on VideoBox.
            </p>


            <Link
              href="/studio"
              className="mt-7 inline-block rounded-full bg-white px-6 py-3 font-bold text-black transition hover:scale-105"
            >
              + Start creating
            </Link>


          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-4 py-10 text-center text-sm text-white/40">
        <p>© 2026 VideoBox. Watch what you love. Discover something new.</p>
        <nav aria-label="Legal" className="mt-4 flex justify-center gap-5 text-xs">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/content-guidelines" className="hover:text-white">Content guidelines</Link>
        </nav>
        <p className="mt-3 text-xs">Support: <a className="hover:text-white" href="mailto:gooroo@gmail.com">gooroo@gmail.com</a> · <a className="hover:text-white" href="tel:09060129459">09060129459</a></p>
      </footer>
    </main >
  );
}
