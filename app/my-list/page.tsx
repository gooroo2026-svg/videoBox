"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

type SavedVideo = {
  id: string;
  slug: string | null;
  title: string;
  creator_name: string | null;
  view_count: number | null;
};

export default function MyListPage() {
  const [userId, setUserId] = useState("");
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyVideoId, setBusyVideoId] = useState("");

  async function loadSavedVideos() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError("Sign in again to open your saved list.");
      setLoading(false);
      return;
    }
    setUserId(authData.user.id);

    // Bring forward saved items from the earlier browser-only list.
    let oldKeys: string[] = [];
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem("videobox-saved-videos") ?? "[]");
      if (Array.isArray(parsed)) oldKeys = parsed.filter((item): item is string => typeof item === "string");
    } catch {
      oldKeys = [];
    }

    if (oldKeys.length) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const legacyUuids = oldKeys.filter((key) => uuidPattern.test(key));
      const legacySlugs = oldKeys.filter((key) => !uuidPattern.test(key));
      const resolvedIds = new Set<string>();

      if (legacyUuids.length) {
        const { data } = await supabase.from("videos").select("id").eq("status", "published").in("id", legacyUuids);
        for (const video of data ?? []) resolvedIds.add(video.id);
      }
      if (legacySlugs.length) {
        const { data } = await supabase.from("videos").select("id").eq("status", "published").in("slug", legacySlugs);
        for (const video of data ?? []) resolvedIds.add(video.id);
      }

      if (resolvedIds.size) {
        const { error: migrateError } = await supabase.from("video_saves").upsert(
          Array.from(resolvedIds, (videoId) => ({ user_id: authData.user.id, video_id: videoId })),
          { onConflict: "user_id,video_id", ignoreDuplicates: true }
        );
        if (migrateError) {
          setError("Run the VideoBox setup script in Supabase to enable My List.");
          setLoading(false);
          return;
        }
      }
      window.localStorage.removeItem("videobox-saved-videos");
    }

    const { data: savedRows, error: savedError } = await supabase
      .from("video_saves")
      .select("video_id, created_at")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });
    if (savedError) {
      setError("Run the VideoBox setup script in Supabase to enable My List.");
      setLoading(false);
      return;
    }

    const ids = (savedRows ?? []).map((row) => row.video_id);
    if (!ids.length) {
      setSavedVideos([]);
      setLoading(false);
      return;
    }

    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("id, slug, title, creator_name, view_count")
      .eq("status", "published")
      .in("id", ids);
    if (videosError) setError(videosError.message);
    else {
      const byId = new Map((videos ?? []).map((video) => [video.id, video as SavedVideo]));
      setSavedVideos(ids.map((id) => byId.get(id)).filter((video): video is SavedVideo => Boolean(video)));
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSavedVideos();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function removeFromList(videoId: string) {
    if (!userId) return;
    setBusyVideoId(videoId);
    const supabase = createClient();
    const { error: removeError } = await supabase
      .from("video_saves")
      .delete()
      .eq("user_id", userId)
      .eq("video_id", videoId);
    if (removeError) setError(removeError.message);
    else setSavedVideos((current) => current.filter((video) => video.id !== videoId));
    setBusyVideoId("");
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-2xl font-black">Video<span className="text-red-500">Box</span></Link>
        <h1 className="mt-10 text-3xl font-black">My List</h1>
        <p className="mt-2 text-white/50">Your saved videos, available wherever you sign in.</p>

        {error && <p role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
        {loading ? (
          <p className="mt-8 rounded-2xl border border-white/10 p-8 text-center text-white/50">Loading your list…</p>
        ) : savedVideos.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 p-8 text-center">
            <p className="font-semibold">Your list is empty for now.</p>
            <p className="mt-2 text-sm text-white/50">Save a video from its Watch page and it will appear here.</p>
            <Link href="/explore" className="mt-5 inline-block rounded-full bg-white px-5 py-3 text-sm font-bold text-black">Explore videos</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedVideos.map((video) => (
              <article key={video.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <Link href={`/watch/${video.slug ?? video.id}`}>
                  <span className="grid aspect-video place-items-center rounded-xl bg-gradient-to-br from-red-950 to-slate-950 text-3xl">▶</span>
                  <h2 className="mt-4 font-bold">{video.title}</h2>
                  <p className="mt-1 text-sm text-white/50">{video.creator_name ?? "VideoBox creator"} · {video.view_count ?? 0} views</p>
                </Link>
                <button type="button" disabled={busyVideoId === video.id} onClick={() => removeFromList(video.id)} className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-red-500/50 hover:text-white disabled:opacity-50">
                  {busyVideoId === video.id ? "Removing…" : "Remove from My List"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}