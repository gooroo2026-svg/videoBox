"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

export default function VideoLikeButton({ videoId }: { videoId: string }) {
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadLike() {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data } = await supabase
        .from("video_likes")
        .select("video_id")
        .eq("video_id", videoId)
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (active) setLiked(Boolean(data));
    }
    loadLike();
    return () => { active = false; };
  }, [videoId]);

  async function toggleLike() {
    setBusy(true);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setBusy(false);
      return;
    }
    const result = liked
      ? await supabase.from("video_likes").delete().eq("user_id", authData.user.id).eq("video_id", videoId)
      : await supabase.from("video_likes").insert({ user_id: authData.user.id, video_id: videoId });
    if (!result.error) setLiked(!liked);
    setBusy(false);
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggleLike}
      aria-label={liked ? "Unlike video" : "Like video"}
      aria-pressed={liked}
      className="ml-auto text-xl transition hover:scale-125 disabled:opacity-50"
    >
      {liked ? "❤️" : "♡"}
    </button>
  );
}