import Link from "next/link";

export default function ContentGuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-12 text-white">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-2xl font-black">Video<span className="text-red-500">Box</span></Link>
        <h1 className="mt-8 text-4xl font-black">Content Guidelines</h1>
        <p className="mt-4 text-sm leading-7 text-white/60">VideoBox is for original, properly licensed entertainment and useful creator work. These basic rules support video review and viewer reports.</p>
        <ul className="mt-6 list-disc space-y-3 pl-6 text-sm leading-7 text-white/60">
          <li>Upload only videos, music, artwork and other material you own or are authorized to use.</li>
          <li>Do not post threats, targeted harassment, scams, impersonation or illegal material.</li>
          <li>Do not share private information about another person without permission.</li>
          <li>Never exploit, groom, sexualize, threaten, or endanger a child; do not post a child&apos;s private contact, school, or location details.</li>
          <li>Use accurate titles, categories and descriptions; do not mislead viewers.</li>
          <li>Report content you believe violates these rules. Admins may remove content or suspend accounts after review.</li>
        </ul>
        <p className="mt-8 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/80">Before public launch, add a copyright complaint contact and a clear process for counter-notices and appeals that fits your location.</p>
        <p className="mt-5 text-sm leading-7 text-white/60">For general support, contact <a className="text-red-300 underline" href="mailto:gooroo@gmail.com">gooroo@gmail.com</a> or <a className="text-red-300 underline" href="tel:09060129459">09060129459</a>. These support details do not replace a legally reviewed copyright notice or appeal process.</p>
        <Link href="/terms" className="mt-8 inline-block text-sm text-red-300 underline">Read the Terms of Use</Link>
      </article>
    </main>
  );
}
