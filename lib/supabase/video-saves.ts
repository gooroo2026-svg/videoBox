import { createClient } from "./client";

export async function isVideoSaved(videoId: string) {
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { saved: false, error: authError?.message ?? "Please sign in again." };

  const { data, error } = await supabase
    .from("video_saves")
    .select("video_id")
    .eq("user_id", authData.user.id)
    .eq("video_id", videoId)
    .maybeSingle();
  return { saved: Boolean(data), error: error?.message ?? null };
}

export async function saveVideoToMyList(videoId: string) {
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return authError?.message ?? "Please sign in again.";

  const { error } = await supabase.from("video_saves").upsert(
    { user_id: authData.user.id, video_id: videoId },
    { onConflict: "user_id,video_id", ignoreDuplicates: true }
  );
  return error?.message ?? null;
}