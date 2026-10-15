"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

type DraftVideo = {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  creator_name: string | null;
  description: string | null;
  cloud_url: string | null;
  created_at: string;
};

function isOwnedStoragePath(path: string, ownerId: string) {
  const parts = path.split("/");
  return parts.length >= 2 && parts[0] === ownerId &&
    parts.every((part) => part.length > 0 && part !== "." && part !== "..");
}

function trustedLegacyStoragePath(value: string | null, ownerId: string) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl || !value) return null;

  try {
    const project = new URL(projectUrl);
    const candidate = new URL(value);
    const publicBucketPrefix = "/storage/v1/object/public/videos/";
    const objectPath = candidate.pathname.startsWith(publicBucketPrefix)
      ? candidate.pathname.slice(publicBucketPrefix.length)
      : "";
    const decodedPath = decodeURIComponent(objectPath);
    if (
      candidate.origin !== project.origin ||
      !isOwnedStoragePath(decodedPath, ownerId)
    ) {
      return null;
    }
    return decodedPath;
  } catch {
    return null;
  }
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<DraftVideo[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyVideoId, setBusyVideoId] = useState("");
  const [message, setMessage] = useState("");

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { data: adminCheck, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || !adminCheck) {
      setMessage("You must be signed in as an admin to review videos.");
      setVideos([]);
      setPreviewUrls({});
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("videos")
      .select("id, user_id, title, category, creator_name, description, cloud_url, created_at")
      .eq("status", "draft")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setVideos([]);
      setPreviewUrls({});
    } else {
      const drafts = (data ?? []) as DraftVideo[];
      setVideos(drafts);
      const previews = await Promise.all(drafts.map(async (video) => {
        if (video.cloud_url?.startsWith("draft:")) {
          const path = video.cloud_url.slice("draft:".length);
          if (!isOwnedStoragePath(path, video.user_id)) {
            return [video.id, ""] as const;
          }
          const { data: signed, error: signedError } = await supabase.storage
            .from("video-drafts")
            .createSignedUrl(path, 60 * 60);
          return [video.id, signedError ? "" : signed.signedUrl] as const;
        }
        return [video.id, video.cloud_url && trustedLegacyStoragePath(video.cloud_url, video.user_id) ? video.cloud_url : ""] as const;
      }));
      setPreviewUrls(Object.fromEntries(previews.filter(([, url]) => url)));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDrafts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDrafts]);

  async function updateDraftStatus(videoId: string, status: "published" | "rejected") {
    setBusyVideoId(videoId);
    setMessage("");

    const supabase = createClient();
    try {
    const draft = videos.find((video) => video.id === videoId);
    if (!draft) {
      setMessage("This draft is no longer in the review queue. Refresh and try again.");
      setBusyVideoId("");
      return;
    }

    const privatePath = draft.cloud_url?.startsWith("draft:")
      ? draft.cloud_url.slice("draft:".length)
      : null;

    if (draft.cloud_url?.startsWith("draft:") && (!privatePath || !isOwnedStoragePath(privatePath, draft.user_id))) {
      setMessage("The private file path does not match this creator. No changes were made.");
      setBusyVideoId("");
      return;
    }

    if (status === "published" && privatePath) {
      const { error: copyError } = await supabase.storage
        .from("video-drafts")
        .copy(privatePath, privatePath, { destinationBucket: "videos" });
      if (copyError) {
        setMessage(`Could not publish the private video file: ${copyError.message}`);
        setBusyVideoId("");
        return;
      }
    }

    const legacyPublicPath = trustedLegacyStoragePath(draft.cloud_url, draft.user_id);
    if (status === "published" && !privatePath && !legacyPublicPath) {
      setMessage("This draft does not use VideoBox's public video storage. No changes were made.");
      setBusyVideoId("");
      return;
    }

    const publicUrl = privatePath
      ? supabase.storage.from("videos").getPublicUrl(privatePath).data.publicUrl
      : draft.cloud_url!;

    const { data: updated, error } = await supabase
      .from("videos")
      .update({ status, ...(status === "published" && privatePath ? { cloud_url: publicUrl } : {}) })
      .eq("id", videoId)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      let rollbackError: string | null = null;
      if (status === "published" && privatePath) {
        const { error: removeError } = await supabase.storage.from("videos").remove([privatePath]);
        rollbackError = removeError?.message ?? null;
      }
      setMessage(rollbackError
        ? `Approval failed and the public copy could not be removed: ${rollbackError}`
        : error?.message ?? "The draft changed before this action completed. Refresh and try again.");
      setBusyVideoId("");
      return;
    }

    if (privatePath) {
      const { error: cleanupError } = await supabase.storage
        .from("video-drafts")
        .remove([privatePath]);
      if (cleanupError) {
        setMessage(status === "published"
          ? "Video published. Its private review copy could not be removed; ask the project owner to clean it up."
          : "Video rejected. Its private file could not be removed; ask the project owner to clean it up.");
      } else {
        setMessage(status === "published" ? "Video approved and published." : "Video rejected and its private file removed.");
      }
    } else if (status === "published") {
      setMessage("Video approved and published. This older draft was already in public storage.");
    } else if (legacyPublicPath) {
      const { data: otherReferences, error: referenceError } = await supabase
        .from("videos")
        .select("id")
        .eq("cloud_url", draft.cloud_url!)
        .neq("id", videoId)
        .limit(1);
      if (referenceError) {
        setMessage("Video rejected, but the old public file could not be safely checked for other uses. Ask the project owner to review it.");
      } else if (otherReferences?.length) {
        setMessage("Video rejected. Its old public file is shared by another video record, so it was left in storage.");
      } else {
        const { error: removeError } = await supabase.storage.from("videos").remove([legacyPublicPath]);
        setMessage(removeError
          ? "Video rejected, but its old public file could not be deleted and may still be accessible by direct URL."
          : "Video rejected and its old public file removed.");
      }
    } else {
      setMessage("Video rejected. Its external file was left unchanged because VideoBox cannot remove it.");
    }

    await loadDrafts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update this draft.");
    } finally {
    setBusyVideoId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-2xl font-black">
          Video<span className="text-red-500">Box</span>
        </Link>

        <h1 className="mt-10 text-3xl font-black">Video review</h1>
        <p className="mt-2 text-white/50">
          Review creator uploads before they appear to viewers.
        </p>

        {message && (
          <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
            {message}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-white/50">Loading drafts...</p>
        ) : videos.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-white/10 p-8 text-center text-white/50">
            There are no videos waiting for review.
          </p>
        ) : (
          <div className="mt-8 grid gap-4">
            {videos.map((video) => (
              <article
                key={video.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <h2 className="text-lg font-bold">{video.title}</h2>
                <p className="mt-1 text-sm text-white/50">
                  {video.creator_name ?? "VideoBox creator"} · {video.category ?? "No category"}
                </p>
                <p className="mt-3 text-sm text-white/70">
                  {video.description || "No description provided."}
                </p>
                {previewUrls[video.id] ? (
                  <video
                    className="mt-4 aspect-video w-full rounded-xl border border-white/10 bg-black object-contain"
                    src={previewUrls[video.id]}
                    controls
                    playsInline
                    preload="metadata"
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <p className="mt-4 text-sm text-amber-200/80">No preview is available. Do not approve until you can review the video.</p>
                )}
                <p className="mt-3 text-xs text-white/40">
                  Uploaded {new Date(video.created_at).toLocaleDateString()}
                </p>

                <button
                  type="button"
                  disabled={busyVideoId === video.id || !previewUrls[video.id]}
                  onClick={() => updateDraftStatus(video.id, "published")}
                  className="mt-5 rounded-full bg-red-500 px-5 py-2 text-sm font-bold hover:bg-red-400 disabled:opacity-60"
                >
                  {busyVideoId === video.id ? "Approving..." : "Approve and publish"}
                </button>
                <button
                  type="button"
                  disabled={busyVideoId === video.id}
                  onClick={() => updateDraftStatus(video.id, "rejected")}
                  className="ml-3 mt-5 rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-white/75 hover:bg-white/10 disabled:opacity-60"
                >
                  {busyVideoId === video.id ? "Saving…" : "Reject"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
