import Link from "next/link"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { ApiDocTester } from "@/app/api/[slug]/api-doc-tester"

type ApiDocPageProps = {
  params: Promise<{ slug: string }>
}

const CURLS = [
  "curl http://localhost:3000/api/metro-transit/vehicles",
  "curl \"http://localhost:3000/api/metro-transit/vehicles?routes=901,902\"",
  "curl \"http://localhost:3000/api/metro-transit/vehicles?routes=METC,645\"",
]

export default async function ApiDocPage({ params }: ApiDocPageProps) {
  const { slug } = await params

  if (slug !== "metro-transit") {
    notFound()
  }

  return (
    <div data-app-scroll-root className="h-[100dvh] overflow-y-auto bg-zinc-950 text-zinc-100">
      <Navigation frameClassName="max-w-none" />
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">API Docs</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-zinc-100">Metro Transit</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Live vehicle positions from Metro Transit GTFS-realtime feed, proxied as JSON.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">Endpoint</h2>
          <p className="mt-2 font-mono text-sm text-zinc-200">GET /api/metro-transit/vehicles</p>
          <h3 className="mt-5 text-sm font-semibold text-zinc-300">Parameters</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            <li>
              <code className="font-mono text-zinc-300">routes</code> (optional): comma-separated route IDs to filter
              vehicles.
            </li>
          </ul>
          <h3 className="mt-5 text-sm font-semibold text-zinc-300">Functionality options</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            <li>All active vehicles (no params).</li>
            <li>Route-specific vehicles (with routes filter).</li>
            <li>JSON output suitable for dashboard/map overlays.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">Available curl commands</h2>
          <div className="mt-3 space-y-2">
            {CURLS.map((cmd) => (
              <pre key={cmd} className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
                {cmd}
              </pre>
            ))}
          </div>
        </section>

        <ApiDocTester />

        <p className="mt-6 text-sm text-zinc-500">
          <Link href="/integrations" className="text-sky-400/90 underline-offset-4 hover:underline">
            ← Back to integrations
          </Link>
        </p>
      </main>
    </div>
  )
}
