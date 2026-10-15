import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-12 text-white">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-2xl font-black">Video<span className="text-red-500">Box</span></Link>
        <p className="mt-8 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/80">Draft notice: review this page and confirm it matches your actual business and local privacy requirements before public launch.</p>
        <h1 className="mt-8 text-4xl font-black">Privacy notice</h1>
        <p className="mt-4 text-sm leading-7 text-white/60">VideoBox uses account and app information to operate the service. This draft describes the features currently being built and must be updated when services or providers change.</p>
        <h2 className="mt-8 text-xl font-bold">Information used</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">Account details such as email address and profile information; videos and descriptions you upload; and activity needed for the service, such as saved videos, likes, comments, follows, reports, viewing counts, and (for signed-in viewers) watch history including the latest playback position and whether a video was completed.</p>
        <h2 className="mt-8 text-xl font-bold">Video files and visibility</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">New video uploads are stored in a private Supabase bucket while awaiting admin review. If approved, the file is copied to public storage and anyone may be able to view or share it. Some older drafts uploaded before this private-review flow may still have publicly accessible direct file URLs until they are migrated or removed. Do not upload private or sensitive videos. Public video hosting and child-specific safeguards must be reviewed before any later release for people under 18.</p>
        <h2 className="mt-8 text-xl font-bold">What other viewers can see</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">Signed-in viewers can see published video titles, descriptions, creator display names, comments, and aggregate view, like, and follower counts. Approved video files are in public storage, so anyone with a direct file URL may be able to open the file even without a VideoBox account. The app does not display individual liker or follower lists; the updated database setup restricts those raw rows to the account owner and admins, so apply it and check for other permissive database policies before relying on that protection.</p>
        <h2 className="mt-8 text-xl font-bold">How it is used</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">To sign you in, show videos, resume playback where you left off, operate creator and moderation tools, keep saved items, count views, respond to reports, prevent abuse, and improve the service. Watch history is associated with the signed-in account and is not shown to other viewers.</p>
        <h2 className="mt-8 text-xl font-bold">Reports and retention</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">When you report a video or comment, VideoBox stores your account ID, account email, the reported item, your selected reason, and any details you provide. Admins reviewing the report can see your email so they can follow up. Watch-history rows are updated as you watch and are removed when the associated account or video is deleted from the database. You can also clear your watch history from Home. A retention period for reports, moderation records, and security logs has not yet been set and must be defined before public launch.</p>
        <h2 className="mt-8 text-xl font-bold">Service providers and advertising</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">VideoBox uses Supabase for authentication, database and video storage. Google AdSense is not enabled by default. If it is enabled later, Google&apos;s ad script and advertising partners may use cookies or similar technology to serve and measure ads. The app does not yet have an advertising consent manager or age-based ad settings, so ads must remain disabled until those are implemented and reviewed for the countries served.</p>
        <h2 className="mt-8 text-xl font-bold">Cookies and browser storage</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">Supabase authentication uses browser cookies to maintain your signed-in session. The My List page may read an older VideoBox saved-list value from browser local storage and move those saved video IDs into your account; it removes that legacy value after migration. Review the actual production cookie/storage inventory and local consent rules before launch.</p>
        <h2 className="mt-8 text-xl font-bold">Where data is processed</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">VideoBox is operated from Nigeria and intends to serve users worldwide. The Supabase project&apos;s hosting region and the locations of all relevant subprocessors have not yet been confirmed for this draft. Before public launch, VideoBox must identify the actual processing countries and explain the transfer safeguards that apply.</p>
        <h2 className="mt-8 text-xl font-bold">Your choices</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">You may choose what to upload, remove saved items from My List, and clear your watch history from Home. There is not yet a self-service account deletion tool. For access, correction, account deletion, or other account-data requests, contact VideoBox at <a className="text-red-300 underline" href="mailto:gooroo@gmail.com">gooroo@gmail.com</a> or <a className="text-red-300 underline" href="tel:09060129459">09060129459</a>. The owner must monitor this contact and follow a documented request process.</p>
        <h2 className="mt-8 text-xl font-bold">Children and parent requests</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">The first release is for people aged 18 or older; local law may require an older age. New signups and existing accounts are asked to complete a birth-date check and confirm they are adults. The date is not added to the VideoBox account; an 18+ self-attestation flag and the current policy-version label are stored in account metadata. This is not identity or verified age assurance, and the policy-version label is not a tamper-proof legal acceptance record. Children will not be eligible until parent or guardian consent, age safeguards, and parent access/deletion tools are built and reviewed for each launch country.</p>
        <h2 className="mt-8 text-xl font-bold">Contact</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">Contact VideoBox support at <a className="text-red-300 underline" href="mailto:gooroo@gmail.com">gooroo@gmail.com</a> or <a className="text-red-300 underline" href="tel:09060129459">09060129459</a>. These are support contacts; formal legal notices may require a separate process.</p>
        <Link href="/terms" className="mt-8 inline-block text-sm text-red-300 underline">Read the Terms of Use</Link>
      </article>
    </main>
  );
}
