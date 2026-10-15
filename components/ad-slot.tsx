"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdSlotProps = { slot: string | undefined; label?: string };

export default function AdSlot({ slot, label = "Advertisement" }: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const consentReady = process.env.NEXT_PUBLIC_ADSENSE_CONSENT_READY === "true";

  useEffect(() => {
    if (!client || !slot || !consentReady) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense may already have initialized this slot during a client navigation.
    }
  }, [client, slot, consentReady]);

  if (!client || !slot || !consentReady) return null;

  return (
    <aside aria-label={label} className="mx-auto my-8 max-w-7xl px-4 sm:px-6">
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</p>
      <ins
        className="adsbygoogle block min-h-[90px] w-full rounded-xl bg-white/[0.02]"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
