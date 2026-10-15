"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase/client";

export default function StudioPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState<"film" | "short">("film");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ views: 0, followers: 0, videos: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setStatsLoading(false);
      return;
    }

    const [videosResult, followersResult] = await Promise.all([
      supabase.from("videos").select("id, view_count").eq("user_id", authData.user.id),
      supabase.rpc("get_creator_follower_count", {
        creator_id_input: authData.user.id,
      }),
    ]);

    if (followersResult.error) {
      setMessage("Follower totals are unavailable. Run the updated VideoBox setup script in Supabase.");
      setMessageIsError(true);
    }

    setStats({
      videos: videosResult.data?.length ?? 0,
      views: (videosResult.data ?? []).reduce((sum, video) => sum + (video.view_count ?? 0), 0),
      followers: Number(followersResult.data ?? 0),
    });
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStats]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageIsError(false);

    if (!videoFile) {
      setMessage("Choose a video file first.");
      setMessageIsError(true);
      return;
    }

    if (!category) {
      setMessage("Choose a category first.");
      setMessageIsError(true);
      return;
    }

    if (videoFile.size > 50 * 1024 * 1024) {
      setMessage("This upload is larger than 50 MB. Choose a smaller video file.");
      setMessageIsError(true);
      return;
    }
    setUploading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Sign in before uploading a video.");
      }

      const extension = videoFile.name.split(".").pop()?.toLowerCase() || "mp4";
      const storagePath = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("video-drafts")
        .upload(storagePath, videoFile, {
          contentType: videoFile.type || "video/mp4",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const cleanTitle = title.trim();
      const slugBase = cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
      const profileDisplayName = authData.user.user_metadata?.display_name;
      const creatorName =
        typeof profileDisplayName === "string" && profileDisplayName.trim()
          ? profileDisplayName.trim()
          : "VideoBox creator";

      const { error: saveError } = await supabase.from("videos").insert({
        user_id: authData.user.id,
        title: cleanTitle,
        description: description.trim(),
        category,
        content_type: contentType,
        cloud_url: `draft:${storagePath}`,
        video_format: videoFile.type || extension,
        view_count: 0,
        slug,
        creator_name: creatorName,
        status: "draft",
        monetization_enabled: false,
      });

      if (saveError) {
        await supabase.storage.from("video-drafts").remove([storagePath]);
        throw new Error(saveError.message);
      }

      setMessage("Video uploaded as a draft for review.");
      await loadStats();
      setTitle("");
      setDescription("");
      setCategory("");
      setContentType("film");
      setVideoFile(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The video could not be uploaded."
      );
      setMessageIsError(true);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black">
            Video<span className="text-red-500">Box</span>
          </Link>
          <nav className="flex gap-5 text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/creator" className="hover:text-white">My channel</Link>
            <Link href="/studio" className="text-white">Studio</Link>
          </nav>
          <Link
            href="/login"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
          Creator tools
        </p>
        <h1 className="mt-2 text-4xl font-black">Creator Studio</h1>
        <p className="mt-3 text-white/55">
          Manage your channel and prepare a new video.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Views", statsLoading ? "…" : stats.views.toLocaleString(), "Views on your videos"],
            ["Followers", statsLoading ? "…" : stats.followers.toLocaleString(), "People following your channel"],
            ["Videos", statsLoading ? "…" : stats.videos.toLocaleString(), "Your uploads and drafts"],
          ].map(([label, value, detail]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <p className="text-sm text-white/50">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
              <p className="mt-1 text-xs text-white/35">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <h2 className="text-xl font-bold">Prepare a video</h2>
            <p role="note" className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4 text-sm leading-6 text-emerald-100/80">
              Draft files stay in private storage while they are reviewed. If approved, the video file moves to public storage and anyone may be able to view or share it. Only upload content you have the right to publish.
            </p>

            <label className="mt-5 block text-sm text-white/70">
              Video file
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                required
                onChange={(event) =>
                  setVideoFile(event.target.files?.[0] ?? null)
                }
                className="mt-2 block w-full rounded-xl border border-dashed border-white/20 bg-black/20 p-5 text-sm text-white/50 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
              />
            </label>

            <label className="mt-5 block text-sm text-white/70">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="Give your video a title"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-red-500/50"
              />
            </label>

            <label className="mt-5 block text-sm text-white/70">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Tell viewers what your video is about"
                className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-red-500/50"
              />
            </label>

            <label className="mt-5 block text-sm text-white/70">
              Video type
              <select
                value={contentType}
                onChange={(event) => setContentType(event.target.value as "film" | "short")}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-red-500/50"
              >
                <option value="film">Film / full video</option>
                <option value="short">Short video</option>
              </select>
            </label>

            <label className="mt-5 block text-sm text-white/70">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-red-500/50"
              >
                <option value="">Choose a category</option>
                <option>Entertainment</option>
                <option>Education</option>
                <option>Music</option>
                <option>Travel</option>
                <option>Film</option>
                <option>Comedy</option>
                <option>Action</option>
                <option>Drama</option>
                <option>Nigerian</option>
                <option>Documentary</option>
              </select>
            </label>

            <button
              disabled={uploading}
              className="mt-6 rounded-full bg-red-500 px-6 py-3 text-sm font-bold hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload draft"}
            </button>

            {message && (
              <p
                className={`mt-4 rounded-xl border p-3 text-sm ${messageIsError
                    ? "border-red-500/20 bg-red-500/10 text-red-200"
                    : "border-green-500/20 bg-green-500/10 text-green-200"
                  }`}
              >
                {message}
              </p>
            )}
          </form>

          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-bold">Before you publish</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/55">
              <li>• Choose a clear, accurate title.</li>
              <li>• Add a description so viewers know what to expect.</li>
              <li>• Select the category that best fits your video.</li>
              <li>• Make sure you have permission to use your video and audio.</li>
              <li>• Your upload is saved as a draft for review.</li>
            </ul>
            <Link
              href="/creator"
              className="mt-6 block rounded-full border border-white/15 px-4 py-2 text-center text-sm hover:bg-white/10"
            >
              View your channel
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
