export default function SuspendedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#080808] p-6 text-white">
      <section className="max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-sm font-bold text-red-400">VideoBox</p>
        <h1 className="mt-3 text-2xl font-bold">Account suspended</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Access to this account is suspended. If you think this is a mistake,
          contact VideoBox support at <a className="text-red-300 underline" href="mailto:gooroo@gmail.com">gooroo@gmail.com</a> or <a className="text-red-300 underline" href="tel:09060129459">09060129459</a>.
        </p>
      </section>
    </main>
  );
}
