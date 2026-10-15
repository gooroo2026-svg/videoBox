"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type CreatorVideo = {
  id: string;
  slug: string | null;
  title: string;
  category: string | null;
  creator_name: string | null;
  view_count: number | null;
};

export default function CreatorProfilePage() {
  const params = useParams<{ id: string }>();
  const creatorId = String(params.id ?? "");
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [creatorName, setCreatorName] = useState("VideoBox creator");
  const [followerCount, setFollowerCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCreator() {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id ?? "";
      if (!cancelled) setCurrentUserId(userId);

      const [videoResult, countResult, followResult] = await Promise.all([
        supabase.from("videos")
          .select("id, slug, title, category, creator_name, view_count")
          .eq("user_id", creatorId)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
        supabase.rpc("get_creator_follower_count", {
          creator_id_input: creatorId,
        }),
        userId && userId !== creatorId
          ? supabase.from("creator_follows").select("creator_id").eq("follower_id", userId).eq("creator_id", creatorId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (!cancelled) {
        if (videoResult.error) setMessage(videoResult.error.message);
        else {
          const loaded = (videoResult.data ?? []) as CreatorVideo[];
          setVideos(loaded);
          if (loaded[0]?.creator_name) setCreatorName(loaded[0].creator_name);
        }
        setFollowerCount(Number(countResult.data ?? 0));
        if (countResult.error) {
          setMessage("Follower totals are unavailable. Run the updated VideoBox setup script in Supabase.");
        }
        setFollowing(Boolean(followResult.data));
        setLoading(false);
      }
    }
    if (creatorId) loadCreator();
    return () => { cancelled = true; };
  }, [creatorId]);

  async function toggleFollow() {
    if (!currentUserId || currentUserId === creatorId) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const result = following
      ? await supabase.from("creator_follows").delete().eq("follower_id", currentUserId).eq("creator_id", creatorId)
      : await supabase.from("creator_follows").insert({ follower_id: currentUserId, creator_id: creatorId });
    if (result.error) setMessage("Following is not ready yet. Run the VideoBox setup script in Supabase.");
    else {
      setFollowing(!following);
      setFollowerCount((count) => Math.max(0, count + (following ? -1 : 1)));
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black">Video<span className="text-red-500">Box</span></Link>
          <nav className="flex gap-5 text-sm text-white/60">
            <Link href="/cinema" className="hover:text-white">Cinema</Link>
            <Link href="/shorts" className="hover:text-white">Shorts</Link>
            <Link href="/explore" className="hover:text-white">Explore</Link>
          </nav>
          <Link href="/studio" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Creator Studio</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="relative h-48 overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-purple-950 to-slate-900 sm:h-64">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(239,68,68,0.35),transparent_35%)]" />
          <p className="absolute bottom-5 left-6 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Creator channel</p>
        </div>

        <div className="relative -mt-12 flex flex-col gap-5 px-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-[#050505] bg-gradient-to-br from-red-500 to-purple-700 text-3xl font-black">{creatorName.charAt(0).toUpperCase()}</div>
            <div className="pb-2">
              <h1 className="text-2xl font-black">{creatorName}</h1>
              <p className="text-sm text-white/50">{followerCount.toLocaleString()} followers</p>
            </div>
          </div>
          {currentUserId !== creatorId && (
            <button type="button" disabled={busy} onClick={toggleFollow} className={`rounded-full px-6 py-3 text-sm font-bold disabled:opacity-50 ${following ? "border border-white/20 bg-white/10" : "bg-red-500 hover:bg-red-400"}`}>
              {busy ? "Saving…" : following ? "Following ✓" : "＋ Follow"}
            </button>
          )}
        </div>

        {message && <p role="status" className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/70">{message}</p>}
        <div className="mt-8 border-b border-white/10 pb-3 text-sm font-semibold">Published videos</div>
        {loading ? <p className="mt-8 text-white/50">Loading channel…</p> : videos.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 p-8 text-center">
            <p className="font-semibold">No published videos yet.</p>
            <p className="mt-2 text-sm text-white/50">Approved creator videos will appear here.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Link href={`/watch/${video.slug ?? video.id}`} key={video.id} className="group">
                <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-950 via-purple-950 to-slate-950">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/20 backdrop-blur">▶</span>
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs">{video.category ?? "Video"}</span>
                </div>
                <h2 className="mt-3 font-bold group-hover:text-red-300">{video.title}</h2>
                <p className="mt-1 text-xs text-white/45">{video.view_count ?? 0} views</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
