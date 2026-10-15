"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "../../../lib/supabase/client";
import AdSlot from "../../../components/ad-slot";

type Video = {
  id: string;
  slug: string | null;
  user_id: string;
  title: string;
  cloud_url: string;
  creator_name: string | null;
  view_count: number | null;
  description: string | null;
};

type VideoComment = {
  id: string;
  body: string;
  created_at: string;
};

export default function WatchPage() {
  const params = useParams<{ id: string }>();
  const videoKey = String(params.id ?? "");
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetCommentId, setReportTargetCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Copyright infringement");
  const [reportDetails, setReportDetails] = useState("");
  const reportFormRef = useRef<HTMLFormElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const historyUserIdRef = useRef<string | null>(null);
  const resumePositionRef = useRef(0);
  const lastHistoryWriteRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function loadVideo() {
      setLoading(true);
      setPageError("");
      const supabase = createClient();
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidPattern.test(videoKey);
      const query = supabase
        .from("videos")
        .select("id, slug, user_id, title, cloud_url, creator_name, view_count, description")
        .eq("status", "published");
      const { data, error } = isUuid
        ? await query.eq("id", videoKey).maybeSingle()
        : await query.eq("slug", videoKey).maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setPageError(error?.message ?? "This video is not available.");
        setLoading(false);
        return;
      }

      const currentVideo = data as Video;
      setVideo(currentVideo);
      setLoading(false);

      const { error: viewError } = await supabase.rpc("increment_video_view", {
        video_id_input: currentVideo.id,
      });
      if (!cancelled && !viewError) {
        setVideo((current) => current ? { ...current, view_count: (current.view_count ?? 0) + 1 } : current);
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      historyUserIdRef.current = authData.user.id;

      const [commentsResult, likesResult, savedResult, historyResult] = await Promise.all([
        supabase
          .from("video_comments")
          .select("id, body, created_at")
          .eq("video_id", currentVideo.id)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
        supabase.rpc("get_video_engagement", {
          video_ids_input: [currentVideo.id],
        }),
        supabase
          .from("video_saves")
          .select("video_id")
          .eq("user_id", authData.user.id)
          .eq("video_id", currentVideo.id)
          .maybeSingle(),
        supabase
          .from("watch_history")
          .select("last_position_seconds, completed")
          .eq("user_id", authData.user.id)
          .eq("video_id", currentVideo.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;
      if (!historyResult.error && historyResult.data && !historyResult.data.completed) {
        resumePositionRef.current = Number(historyResult.data.last_position_seconds ?? 0);
      }
      if (commentsResult.error || likesResult.error || savedResult.error) {
        setMessage("Run the VideoBox setup script in Supabase to enable comments, likes, and saved videos.");
      } else {
        setComments((commentsResult.data ?? []) as VideoComment[]);
        const engagement = likesResult.data?.[0];
        setLikeCount(Number(engagement?.like_count ?? 0));
        setLiked(Boolean(engagement?.liked_by_me));
        setSaved(Boolean(savedResult.data));
      }
    }

    if (videoKey) loadVideo();
    return () => { cancelled = true; };
  }, [videoKey]);

  function resumePlayback() {
    const player = videoElementRef.current;
    const position = resumePositionRef.current;
    if (player && position > 0 && position < player.duration - 5) {
      player.currentTime = position;
    }
  }

  async function savePlaybackProgress(force = false) {
    const player = videoElementRef.current;
    const userId = historyUserIdRef.current;
    if (!player || !video || !userId || !Number.isFinite(player.currentTime)) return;
    const position = Math.floor(player.currentTime);
    if (!force && position - lastHistoryWriteRef.current < 15) return;
    lastHistoryWriteRef.current = position;
    const supabase = createClient();
    const { error } = await supabase.from("watch_history").upsert({
      user_id: userId,
      video_id: video.id,
      last_position_seconds: position,
      completed: player.ended || (Number.isFinite(player.duration) && player.duration > 0 && position >= player.duration - 5),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,video_id" });
    if (error) console.error("Could not save playback progress:", error.message);
  }

  async function toggleLike() {
    if (!video) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setMessage("Sign in again to like this video.");
      setBusy(false);
      return;
    }

    const result = liked
      ? await supabase.from("video_likes").delete().eq("user_id", authData.user.id).eq("video_id", video.id)
      : await supabase.from("video_likes").insert({ user_id: authData.user.id, video_id: video.id });
    if (result.error) {
      setMessage("Likes are not ready yet. Run the VideoBox setup script in Supabase.");
    } else {
      setLiked(!liked);
      setLikeCount((count) => Math.max(0, count + (liked ? -1 : 1)));
    }
    setBusy(false);
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!video || !comment.trim()) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setMessage("Sign in again to comment.");
      setBusy(false);
      return;
    }

    const { data, error } = await supabase
      .from("video_comments")
      .insert({ user_id: authData.user.id, video_id: video.id, body: comment.trim() })
      .select("id, body, created_at")
      .single();
    if (error) {
      setMessage("Comments are not ready yet. Run the VideoBox setup script in Supabase.");
    } else {
      setComments((current) => [data as VideoComment, ...current]);
      setComment("");
    }
    setBusy(false);
  }

  async function saveVideo() {
    if (!video || saved) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setMessage("Sign in again to save this video.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("video_saves").upsert(
      { user_id: authData.user.id, video_id: video.id },
      { onConflict: "user_id,video_id", ignoreDuplicates: true }
    );
    if (error) {
      setMessage("Saved videos are not ready yet. Run the VideoBox setup script in Supabase.");
    } else {
      setSaved(true);
      setMessage("Saved to My List.");
    }
    setBusy(false);
  }

  function reportVideo() {
    setMessage("");
    setReportTargetCommentId(null);
    setReportOpen((open) => !open);
  }

  function reportComment(commentId: string) {
    setMessage("");
    setReportTargetCommentId(commentId);
    setReportReason("Harassment or hate");
    setReportDetails("");
    setReportOpen(true);
    requestAnimationFrame(() => {
      reportFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function submitVideoReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!video || reportDetails.trim().length < 10) {
      setMessage("Please add at least 10 characters explaining the concern.");
      return;
    }
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setMessage("Sign in again to report this video.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("video_reports").insert({
      reporter_id: authData.user.id,
      reporter_email: authData.user.email ?? null,
      video_id: video.id,
      comment_id: reportTargetCommentId,
      reason: reportReason,
      details: reportDetails.trim(),
    });
    if (error) {
      setMessage("Report form is not ready yet. Run the VideoBox report SQL update in Supabase, then try again.");
    } else {
      setReportOpen(false);
      setReportTargetCommentId(null);
      setReportDetails("");
      setMessage("Report sent to VideoBox admins for review.");
    }
    setBusy(false);
  }
  async function shareVideo() {
    setMessage("");
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Video link copied.");
    } catch {
      setMessage("Copy the page address from your browser to share this video.");
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-[#050505] p-8 text-white">Loading video…</main>;
  }

  if (pageError || !video) {
    return (
      <main className="min-h-screen bg-[#050505] p-8 text-white">
        <p>{pageError || "Video not found."}</p>
        <Link href="/explore" className="mt-4 inline-block underline">Back to Explore</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black">Video<span className="text-red-500">Box</span></Link>
          <Link href="/explore" className="text-sm text-white/60 hover:text-white">← Back to Explore</Link>
          <Link href="/my-list" className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10">My List</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_320px]">
        <section>
          <video ref={videoElementRef} onLoadedMetadata={resumePlayback} onTimeUpdate={() => void savePlaybackProgress()} onPause={() => void savePlaybackProgress(true)} onEnded={() => void savePlaybackProgress(true)} className="aspect-video w-full rounded-3xl border border-white/10 bg-black object-contain" src={video.cloud_url} controls playsInline preload="metadata">
            Your browser does not support video playback.
          </video>
          <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_WATCH_SLOT} />
          <h1 className="mt-6 text-2xl font-black sm:text-3xl">{video.title}</h1>
          <p className="mt-2 text-sm text-white/50">{video.creator_name ?? "VideoBox creator"} · {video.view_count ?? 0} views · {likeCount} likes</p>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-white/10 pb-6">
            <button type="button" disabled={busy} onClick={toggleLike} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm disabled:opacity-50">
              {liked ? "❤️ Liked" : "♡ Like"}
            </button>
            <button type="button" onClick={shareVideo} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm">↗ Share</button>
            <button type="button" disabled={busy || saved} onClick={saveVideo} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm disabled:opacity-50">
              {saved ? "✓ Saved" : "＋ Save"}
            </button>            <button type="button" disabled={busy} onClick={reportVideo} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/65 hover:text-white disabled:opacity-50">
              Report
            </button>
          </div>
          {reportOpen && (
            <form ref={reportFormRef} id="video-report-form" onSubmit={submitVideoReport} className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-bold">{reportTargetCommentId ? "Report this comment" : "Report this video"}</h2>
              <label className="block text-sm text-white/70">
                What is the concern?
                <select
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white"
                >
                  <option>Copyright infringement</option>
                  <option>Child safety concern</option>
                  <option>Harassment or hate</option>
                  <option>Abusive or harmful comment</option>
                  <option>Privacy violation</option>
                  <option>Violence or illegal activity</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="block text-sm text-white/70">
                {reportTargetCommentId
                  ? "Explain what is wrong with this comment."
                  : "Give enough detail for an admin to review. For copyright concerns, name the work and point to the part of this video that uses it."}
                <textarea
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none focus:border-red-500/50"
                  placeholder="Describe the concern and where it appears..."
                />
              </label>
              <p className="text-xs leading-5 text-white/45">Your signed-in account email will be shared with the VideoBox admin reviewing this report so they can follow up. This report form is for app moderation and may not replace a formal legal notice required in your country.</p>
              <div className="flex gap-3">
                <button type="submit" disabled={busy} className="rounded-full bg-red-500 px-5 py-2 text-sm font-bold disabled:opacity-50">{busy ? "Sending…" : "Send report"}</button>
                <button type="button" onClick={() => { setReportOpen(false); setReportTargetCommentId(null); }} className="rounded-full border border-white/15 px-5 py-2 text-sm">Cancel</button>
              </div>
            </form>
          )}
          {message && <p role="status" className="mt-3 text-sm text-white/60">{message}</p>}

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="font-bold">About this video</p>
            <p className="mt-2 text-sm leading-6 text-white/55">{video.description || "No description yet."}</p>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Comments <span className="text-white/40">({comments.length})</span></h2>
            <form onSubmit={addComment} className="mt-4 flex gap-2">
              <input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm outline-none focus:border-red-500/50" />
              <button disabled={busy || !comment.trim()} className="rounded-xl bg-red-500 px-4 py-3 text-sm font-bold hover:bg-red-400 disabled:opacity-50">Post</button>
            </form>
            <div className="mt-5 space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-white/45">No comments yet. Start the conversation.</p>
              ) : comments.map((item) => (
                <article key={item.id} className="rounded-xl bg-white/[0.04] p-4">
                  <p className="text-xs text-white/40">Viewer · {new Date(item.created_at).toLocaleDateString()}</p>
                  <p className="mt-2 text-sm text-white/75">{item.body}</p>
                  <button type="button" disabled={busy} onClick={() => reportComment(item.id)} className="mt-3 text-xs text-white/45 underline hover:text-white disabled:opacity-50">Report comment</button>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Creator</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-red-500 to-purple-700 font-bold">{(video.creator_name ?? "V").charAt(0).toUpperCase()}</div>
            <div><p className="font-bold">{video.creator_name ?? "VideoBox creator"}</p><p className="text-xs text-white/45">VideoBox creator</p></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/55">More videos from this creator.</p>
          <Link href={`/creator/${video.user_id}`} className="mt-5 block rounded-full border border-white/15 px-4 py-2 text-center text-sm hover:bg-white/10">View creator profile</Link>
        </aside>
      </div>
    </main>
  );
}
