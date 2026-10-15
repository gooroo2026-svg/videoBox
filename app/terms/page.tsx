import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-12 text-white">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-2xl font-black">Video<span className="text-red-500">Box</span></Link>
        <p className="mt-8 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/80">Draft terms: review and customize these rules for your business and location before public launch.</p>
        <h1 className="mt-8 text-4xl font-black">Terms of Use</h1>
        <p className="mt-4 text-sm leading-7 text-white/60">By using VideoBox, you agree to use the service lawfully and respect other people’s rights. These draft terms need owner and jurisdiction-specific review.</p>
        <h2 className="mt-8 text-xl font-bold">Accounts</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">Keep your sign-in details secure and provide accurate account information. Do not use another person’s account or try to bypass a suspension.</p>
        <h2 className="mt-8 text-xl font-bold">Children and family accounts</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">The first release is intended for people aged 18 or older; local law may require an older age. People under 18 may not create accounts during this phase. The owner may consider family accounts later, after age safeguards, parent or guardian consent, privacy controls, and country-specific legal review are complete.</p>
        <h2 className="mt-8 text-xl font-bold">Videos and other uploads</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">Upload only content you created or have permission to publish and monetize, including the music and images in it. You keep ownership of your content and give VideoBox permission to store, process and display it as needed to operate the service. Add the full license terms you want creators to grant before accepting public uploads.</p>
        <h2 className="mt-8 text-xl font-bold">Moderation</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">VideoBox may review reports, reject drafts, hide content or suspend accounts that appear to break these rules or applicable law. Users can report videos and comments for admin review. The report tools are not a complete copyright notice, counter-notice, or user appeal process; those procedures and response timelines must be published before public launch.</p>
        <h2 className="mt-8 text-xl font-bold">Earnings</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">Advertising, subscriptions, creator payouts and withdrawals are not active unless VideoBox clearly announces and enables them. No earnings are promised by uploading or viewing content.</p>
        <h2 className="mt-8 text-xl font-bold">Contact and governing terms</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">For general support, contact <a className="text-red-300 underline" href="mailto:gooroo@gmail.com">gooroo@gmail.com</a> or <a className="text-red-300 underline" href="tel:09060129459">09060129459</a>. The operator’s legal name and applicable governing terms still need to be completed and reviewed for the locations served.</p>
        <Link href="/content-guidelines" className="mt-8 inline-block text-sm text-red-300 underline">Read Content Guidelines</Link>
      </article>
    </main>
  );
}
