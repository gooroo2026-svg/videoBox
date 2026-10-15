import { NextResponse } from "next/server";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
  const publisherId = client.replace(/^ca-/, "");

  if (!/^pub-[0-9]{16}$/.test(publisherId)) {
    return new NextResponse("AdSense publisher ID is not configured.\n", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}