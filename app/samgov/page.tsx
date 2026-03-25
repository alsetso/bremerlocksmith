import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { OpportunitiesPreview } from "@/app/samgov/opportunities-preview"

export const metadata = {
  title: "SAM.gov opportunities search",
  description: "Contract opportunities search via SAM.gov (server-side API key).",
}

export default function SamGovPage() {
  return (
    <div data-app-scroll-root className="h-[100dvh] overflow-y-auto bg-zinc-950 text-zinc-100">
      <Navigation frameClassName="max-w-none" />
      <div className="mx-auto max-w-4xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Integrations</p>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          SAM.gov opportunities
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          This app proxies{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-emerald-300/90">
            GET https://api.sam.gov/prod/opportunities/v2/search
          </code>{" "}
          using <code className="font-mono text-xs text-zinc-300">SAM_GOV_API_KEY</code> from the server environment
          (never sent to the browser).
        </p>
        <OpportunitiesPreview />

        <section className="mt-8 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-200">API routes (this project)</h2>
          <ul className="list-inside list-disc space-y-2 text-sm text-zinc-400">
            <li>
              <strong className="text-zinc-300">GET</strong>{" "}
              <code className="font-mono text-xs text-emerald-300/90">/api/samgov</code> — query parameters override
              defaults (e.g. <code className="font-mono text-[11px]">?limit=10&amp;ptype=o</code>).
            </li>
            <li>
              <strong className="text-zinc-300">POST</strong>{" "}
              <code className="font-mono text-xs text-emerald-300/90">/api/samgov</code> — JSON body with the same
              fields as SAM query params.
            </li>
          </ul>
        </section>

        <section className="mt-6 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-200">Default “bids I can submit” params</h2>
          <p className="text-sm text-zinc-500">
            Applied when you do not override them. NAICS is sent as <code className="font-mono text-zinc-400">ncode</code>{" "}
            (you may pass <code className="font-mono text-zinc-400">naics</code> in JSON — it maps to{" "}
            <code className="font-mono text-zinc-400">ncode</code>).
          </p>
          <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-300">
            {`ncode=541810          ← NAICS (Advertising Agencies)
active=true
ptype=o               ← Solicitation (main biddable type)
limit=25
offset=0
postedFrom=03/01/2026
postedTo=03/25/2026   ← MM/dd/yyyy`}
          </pre>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-200">Procurement type codes (ptype)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2 pr-3 font-medium">Code</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 font-medium">Biddable?</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-zinc-800/80">
                  <td className="py-2 pr-3 font-mono text-emerald-300/90">o</td>
                  <td className="py-2 pr-3">Solicitation</td>
                  <td className="py-2 text-emerald-400/90">Yes</td>
                </tr>
                <tr className="border-b border-zinc-800/80">
                  <td className="py-2 pr-3 font-mono text-emerald-300/90">k</td>
                  <td className="py-2 pr-3">Combined Synopsis/Solicitation</td>
                  <td className="py-2 text-emerald-400/90">Yes</td>
                </tr>
                <tr className="border-b border-zinc-800/80">
                  <td className="py-2 pr-3 font-mono text-amber-300/90">r</td>
                  <td className="py-2 pr-3">Sources Sought</td>
                  <td className="py-2 text-amber-400/90">Market research only</td>
                </tr>
                <tr className="border-b border-zinc-800/80">
                  <td className="py-2 pr-3 font-mono text-amber-300/90">p</td>
                  <td className="py-2 pr-3">Pre-solicitation</td>
                  <td className="py-2 text-amber-400/90">Not yet open</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-mono text-red-300/90">a</td>
                  <td className="py-2 pr-3">Award Notice</td>
                  <td className="py-2 text-red-400/90">Already awarded</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            See GSA Open Technology documentation for the full Opportunities API parameter list.
          </p>
        </section>

        <p className="mt-10 text-sm text-zinc-500">
          <Link href="/" className="text-sky-400/90 underline-offset-4 hover:underline">
            ← Back home
          </Link>
        </p>
      </div>
    </div>
  )
}
