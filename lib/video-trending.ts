export type TrendingVideo = {
  id: string;
  title: string;
  category: string;
  creator_name: string | null;
  view_count: number | null;
  created_at?: string | null;
  like_count?: number | null;
  love_count?: number | null;
  comment_count?: number | null;
  saved_count?: number | null;
};

export function rankTrendingVideos(videos: TrendingVideo[]) {
  const now = Date.now();

  return [...videos].sort((first, second) => {
    const firstScore = scoreVideo(first, now);
    const secondScore = scoreVideo(second, now);
    if (firstScore !== secondScore) return secondScore - firstScore;
    return (second.view_count ?? 0) - (first.view_count ?? 0);
  });
}

function scoreVideo(video: TrendingVideo, now: number) {
  const daysAgo = video.created_at
    ? Math.max(1, (now - new Date(video.created_at).getTime()) / 86400000)
    : 30;

  const totalViews = Number(video.view_count ?? 0);
  const likes = Number(video.like_count ?? 0);
  const loves = Number(video.love_count ?? 0);
  const comments = Number(video.comment_count ?? 0);
  const saves = Number(video.saved_count ?? 0);
  const recencyBoost = Math.max(0, 30 - daysAgo) * 2.5;

  return totalViews * 1 + likes * 3 + loves * 4 + comments * 5 + saves * 6 + recencyBoost;
}
