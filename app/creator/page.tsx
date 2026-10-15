"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function CreatorPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    createClient().auth.getUser().then(({ data }) => {
      if (active && data.user) router.replace(`/creator/${data.user.id}`);
      else if (active) router.replace("/login");
    });
    return () => { active = false; };
  }, [router]);

  return <main className="min-h-screen bg-[#050505] p-8 text-white">Opening your channel…</main>;
}