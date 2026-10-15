"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

type Report = {
  id: string;
  reporter_id: string;
  reporter_email: string | null;
  video_id: string;
  comment_id: string | null;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
};

type ReportVideo = { id: string; title: string; slug: string | null };
type ReportComment = { id: string; body: string };

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [videoTitles, setVideoTitles] = useState<Record<string, ReportVideo>>({});
  const [reportedComments, setReportedComments] = useState<Record<string, ReportComment>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyReportId, setBusyReportId] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { data: adminCheck, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || !adminCheck) {
      setMessage("You must sign in as an admin to review reports.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("video_reports")
      .select("id, reporter_id, reporter_email, video_id, comment_id, reason, details, status, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (error) {
      setMessage("Run the latest VideoBox report SQL update in Supabase, then refresh.");
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Report[];
    setReports(rows);
    const videoIds = [...new Set(rows.map((report) => report.video_id))];
    const commentIds = [...new Set(rows.flatMap((report) => report.comment_id ? [report.comment_id] : []))];
    if (videoIds.length) {
      const { data: videos } = await supabase.from("videos").select("id, title, slug").in("id", videoIds);
      setVideoTitles(Object.fromEntries((videos ?? []).map((video) => [video.id, video as ReportVideo])));
    } else setVideoTitles({});
    if (commentIds.length) {
      const { data: comments } = await supabase.from("video_comments").select("id, body").in("id", commentIds);
      setReportedComments(Object.fromEntries((comments ?? []).map((comment) => [comment.id, comment as ReportComment])));
    } else setReportedComments({});
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReports]);

  async function updateReport(reportId: string, status: "reviewed" | "dismissed") {
    setBusyReportId(reportId);
    const supabase = createClient();
    const { error } = await supabase.from("video_reports").update({ status }).eq("id", reportId);
    if (error) setMessage(error.message);
    else {
      setReports((current) => current.filter((report) => report.id !== reportId));
      setMessage(status === "reviewed" ? "Report marked reviewed." : "Report dismissed.");
    }
    setBusyReportId("");
  }

  async function removeReportedVideo(report: Report) {
    const video = videoTitles[report.video_id];
    if (!video) {
      setMessage("The video record could not be found. Review or dismiss this report instead.");
      return;
    }

    if (!window.confirm(`Remove “${video.title}” from public viewing? This hides it from the app.`)) {
      return;
    }

    setBusyReportId(report.id);
    setMessage("");
    const supabase = createClient();
    const { data: updatedVideo, error: videoError } = await supabase
      .from("videos")
      .update({ status: "rejected" })
      .eq("id", report.video_id)
      .eq("status", "published")
      .select("id")
      .maybeSingle();

    if (videoError || !updatedVideo) {
      setMessage(videoError?.message ?? "The video was not published or could not be removed.");
      setBusyReportId("");
      return;
    }

    const { error: reportError } = await supabase
      .from("video_reports")
      .update({ status: "reviewed" })
      .eq("id", report.id)
      .eq("status", "open");

    if (reportError) {
      setMessage("The video is hidden, but the report could not be marked reviewed. Refresh and review it again.");
    } else {
      setReports((current) => current.filter((item) => item.id !== report.id));
      setMessage("The video is hidden from public viewing and the report is marked reviewed.");
    }
    setBusyReportId("");
  }

  async function hideReportedComment(report: Report) {
    if (!report.comment_id) return;
    if (!window.confirm("Hide this comment from public viewing?")) return;

    setBusyReportId(report.id);
    setMessage("");
    const supabase = createClient();
    const { data: hiddenComment, error: commentError } = await supabase
      .from("video_comments")
      .update({ status: "hidden" })
      .eq("id", report.comment_id)
      .eq("video_id", report.video_id)
      .eq("status", "published")
      .select("id")
      .maybeSingle();

    if (commentError || !hiddenComment) {
      setMessage(commentError?.message ?? "The comment was already hidden or could not be found.");
      setBusyReportId("");
      return;
    }

    const { error: reportError } = await supabase
      .from("video_reports")
      .update({ status: "reviewed" })
      .eq("id", report.id)
      .eq("status", "open");

    if (reportError) {
      setMessage("The comment is hidden, but the report could not be marked reviewed. Refresh and review it again.");
    } else {
      setReports((current) => current.filter((item) => item.id !== report.id));
      setMessage("The comment is hidden from public viewing and the report is marked reviewed.");
    }
    setBusyReportId("");
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-white/55 hover:text-white">← Admin dashboard</Link>
        <h1 className="mt-5 text-3xl font-black">Video reports</h1>
        <p className="mt-2 text-white/50">Review videos and comments reported by viewers.</p>
        {message && <p role="status" className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">{message}</p>}
        {loading ? <p className="mt-8 text-white/50">Loading reports…</p> : reports.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-white/10 p-8 text-center text-white/50">No open reports.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {reports.map((report) => {
              const video = videoTitles[report.video_id];
              return (
                <article key={report.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold">{video?.title ?? "Video no longer available"}</h2>
                      {video && <Link href={`/watch/${video.slug ?? video.id}`} className="mt-1 inline-block text-xs text-red-300 underline">Open video</Link>}
                      {report.comment_id && <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-orange-200/70">Reported comment</p>}
                      {report.comment_id && <p className="mt-1 rounded-lg bg-black/30 p-3 text-sm text-white/70">{reportedComments[report.comment_id]?.body ?? "Comment is no longer available."}</p>}
                      <p className="mt-3 text-sm text-white/70">Reason: {report.reason}</p>
                      {report.details && <p className="mt-2 text-sm text-white/50">{report.details}</p>}
                      {report.reporter_email && <p className="mt-3 text-xs text-white/45">Reporter contact: {report.reporter_email}</p>}
                      <p className="mt-3 text-xs text-white/35">Reported {new Date(report.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {report.comment_id ? (
                        <button
                          type="button"
                          disabled={busyReportId === report.id}
                          onClick={() => hideReportedComment(report)}
                          className="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {busyReportId === report.id ? "Hiding…" : "Hide comment"}
                        </button>
                      ) : video && (
                        <button
                          type="button"
                          disabled={busyReportId === report.id}
                          onClick={() => removeReportedVideo(report)}
                          className="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {busyReportId === report.id ? "Removing…" : "Remove video"}
                        </button>
                      )}
                      <button type="button" disabled={busyReportId === report.id} onClick={() => updateReport(report.id, "reviewed")} className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold disabled:opacity-50">Mark reviewed</button>
                      <button type="button" disabled={busyReportId === report.id} onClick={() => updateReport(report.id, "dismissed")} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50">Dismiss</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
