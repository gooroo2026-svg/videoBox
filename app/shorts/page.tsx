"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type ShortVideo = {
  id: string;
  slug: string | null;
  title: string;
  cloud_url: string;
  creator_name: string | null;
  view_count: number | null;
};

export default function ShortsPage() {
  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyVideoId, setBusyVideoId] = useState("");

  useEffect(() => {
    async function loadShorts() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("videos")
        .select("id, slug, title, cloud_url, creator_name, view_count")
        .eq("status", "published")
        .eq("content_type", "short")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Could not load Shorts. Run the VideoBox setup script in Supabase, then refresh.");
        setLoading(false);
        return;
      }

      const loaded = (data ?? []) as ShortVideo[];
      setShorts(loaded);

      if (loaded.length) {
        const { data: engagement, error: engagementError } = await supabase.rpc(
          "get_video_engagement",
          { video_ids_input: loaded.map((video) => video.id) }
        );

        if (!engagementError) {
          const counts: Record<string, number> = {};
          const mine: string[] = [];
          for (const item of engagement ?? []) {
            counts[item.video_id] = Number(item.like_count ?? 0);
            if (item.liked_by_me) mine.push(item.video_id);
          }
          setLikeCounts(counts);
          setLikedIds(mine);
        } else {
          setMessage("Likes are not ready yet. Run the updated VideoBox setup script in Supabase.");
        }
      }
      setLoading(false);
    }

    loadShorts();
  }, []);

  async function toggleLike(videoId: string) {
    setBusyVideoId(videoId);
    setMessage("");
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setMessage("Sign in again to like a Short.");
      setBusyVideoId("");
      return;
    }

    const isLiked = likedIds.includes(videoId);
    const result = isLiked
      ? await supabase.from("video_likes").delete().eq("video_id", videoId).eq("user_id", authData.user.id)
      : await supabase.from("video_likes").insert({ video_id: videoId, user_id: authData.user.id });

    if (result.error) {
      setMessage("Likes are not ready yet. Run the VideoBox setup script in Supabase.");
    } else {
      setLikedIds((current) => isLiked ? current.filter((id) => id !== videoId) : [...current, videoId]);
      setLikeCounts((current) => ({ ...current, [videoId]: Math.max(0, (current[videoId] ?? 0) + (isLiked ? -1 : 1)) }));
    }
    setBusyVideoId("");
  }

  async function shareVideo(video: ShortVideo) {
    const url = `${window.location.origin}/watch/${video.slug ?? video.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Short link copied.");
    } catch {
      setMessage(url);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black">Video<span className="text-red-500">Box</span></Link>
          <nav className="flex gap-5 text-sm text-white/65">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/cinema" className="hover:text-white">Cinema</Link>
            <Link href="/shorts" className="text-white">Shorts</Link>
            <Link href="/explore" className="hover:text-white">Explore</Link>
          </nav>
          <Link href="/studio" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Upload</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">Quick entertainment</p>
          <h1 className="mt-2 text-3xl font-black">Video Shorts</h1>
          <p className="mt-2 text-sm text-white/50">Short videos published by VideoBox creators.</p>
        </div>

        {message && <p role="status" className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/70">{message}</p>}
        {loading ? (
          <p className="rounded-2xl border border-white/10 p-8 text-center text-white/50">Loading Shorts…</p>
        ) : shorts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-8 text-center">
            <p className="font-semibold">No Shorts published yet.</p>
            <p className="mt-2 text-sm text-white/50">Upload a short video in Studio and choose “Short video.”</p>
            <Link href="/studio" className="mt-5 inline-block rounded-full bg-red-500 px-5 py-3 text-sm font-bold">Upload a Short</Link>
          </div>
        ) : (
          <div className="mx-auto flex h-[calc(100vh-190px)] max-w-[420px] snap-y snap-mandatory flex-col gap-4 overflow-y-auto scroll-smooth pb-4">
            {shorts.map((short) => (
              <article key={short.id} className="relative mx-auto flex min-h-[calc(100vh-250px)] w-full max-w-[380px] snap-start flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-800 to-slate-950 p-5 shadow-2xl">
                <video className="absolute inset-0 h-full w-full object-cover" src={short.cloud_url} controls playsInline preload="metadata">
                  Your browser does not support video playback.
                </video>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />
                <div className="relative flex items-center justify-between">
                  <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs backdrop-blur">SHORT</span>
                  <span className="rounded-full bg-black/40 px-3 py-1 text-xs">{short.view_count ?? 0} views</span>
                </div>
                <div className="relative flex items-end justify-between gap-4">
                  <div className="min-w-0 rounded-xl bg-black/40 p-3 backdrop-blur-sm">
                    <p className="font-bold">{short.creator_name ?? "VideoBox creator"}</p>
                    <p className="mt-2 text-sm font-semibold">{short.title}</p>
                    <Link href={`/watch/${short.slug ?? short.id}`} className="mt-2 inline-block text-xs text-red-200 underline">Open watch page</Link>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-3 rounded-xl bg-black/40 p-3">
                    <button type="button" disabled={busyVideoId === short.id} onClick={() => toggleLike(short.id)} className="text-2xl disabled:opacity-50" aria-label={likedIds.includes(short.id) ? "Unlike Short" : "Like Short"}>
                      {likedIds.includes(short.id) ? "❤️" : "♡"}
                    </button>
                    <span className="text-xs">{likeCounts[short.id] ?? 0}</span>
                    <Link href={`/watch/${short.slug ?? short.id}`} className="text-2xl" aria-label="Open comments">◌</Link>
                    <button type="button" onClick={() => shareVideo(short)} className="text-2xl" aria-label="Share Short">↗</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
