import Link from "next/link"
import Image from "next/image"
import { Navigation } from "@/components/navigation"

const INTEGRATIONS = [
  {
    name: "Metro Transit",
    description: "Live vehicle positions and route context for map-aware dispatch decisions.",
    href: "/api/metro-transit",
    cta: "Open docs",
    status: "active",
    tone: "text-teal-300",
  },
  {
    name: "SAM.gov Opportunities",
    description: "Search federal opportunities with server-side API key handling and filter presets.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-rose-300",
  },
  {
    name: "Dispatch SMS",
    description: "Two-way customer messaging stream with timestamped updates and response templates.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Stripe Billing",
    description: "Payment intents, pricing, receipts, and invoice status for service completion workflows.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Driver Onboarding",
    description: "Intake flow for partner drivers, eligibility checks, and profile verification tracking.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Mapbox Geocoding",
    description: "Address search, reverse geocoding, and pin confirmation to improve dispatch accuracy.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Route ETA Engine",
    description: "Estimate arrival windows based on route context, map speed, and responder status.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Support Tickets",
    description: "Internal queue for unresolved service requests and post-dispatch follow-up tasks.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Fleet Telemetry",
    description: "Vehicle health, movement diagnostics, and status snapshots for operating visibility.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Identity Verification",
    description: "Customer and provider identity checks before service confirmation and payout release.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Analytics Warehouse",
    description: "Operational metrics, conversion trends, and service-level reporting for leadership.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Email Delivery",
    description: "Transactional alerts for service requests, payment status, and fulfillment milestones.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Partner CRM",
    description: "Account records, contact history, and pipeline management for strategic partners.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Document Vault",
    description: "Secure storage for contracts, onboarding files, and policy acknowledgements.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Availability Calendar",
    description: "Team scheduling and responder availability windows synchronized across regions.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "Incident Replay",
    description: "Timeline playback of map, communication, and dispatch actions for QA reviews.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
  {
    name: "State Procurement Feed",
    description: "Regional contract feed ingestion for expanded bid intelligence and matching.",
    href: "/integrations",
    cta: "Under Review",
    status: "review",
    tone: "text-zinc-200",
  },
]

function cutAt90(input: string): string {
  if (input.length <= 90) return input
  return `${input.slice(0, 90).trimEnd()}...`
}

export const metadata = {
  title: "Integrations — Bremer Locksmith",
  description: "Connected tools powering dispatch and opportunity workflows.",
}

export default function IntegrationsPage() {
  return (
    <div data-app-scroll-root className="h-[100dvh] overflow-y-auto bg-zinc-950 text-zinc-100">
      <Navigation frameClassName="max-w-none" />

      <main className="w-full pb-12 pt-0">
        <section className="relative overflow-hidden bg-zinc-950 px-6 py-10 sm:px-10 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(244,114,182,0.16),transparent_40%),radial-gradient(circle_at_84%_20%,rgba(20,184,166,0.16),transparent_38%)]" />
          <div className="relative">
            <h1 className="mx-auto mt-6 max-w-4xl text-center font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl">
              Connected integrations for faster operations.
            </h1>
            <span className="mx-auto mt-6 block h-px w-16 bg-rose-400/80" />
            <p className="mx-auto mt-6 max-w-4xl text-center text-lg leading-relaxed text-zinc-300 sm:text-[1.75rem] sm:leading-relaxed sm:tracking-tight">
              Centralized tools for live mobility intelligence and federal opportunity workflows.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INTEGRATIONS.map((item) => (
              <article
                key={item.name}
                className={`flex min-h-[19.5rem] flex-col overflow-hidden rounded-2xl border ${
                  item.status === "active"
                    ? "border-zinc-800 bg-zinc-900/50"
                    : "border-zinc-800/70 bg-zinc-900/35 opacity-70 saturate-50"
                }`}
              >
                <div className="relative h-28 w-full shrink-0">
                  <Image src="/placeholder.svg" alt="" fill className="object-cover opacity-70" aria-hidden />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 to-transparent" />
                </div>
                <div className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className={`font-serif text-xl font-semibold tracking-tight ${item.tone}`}>{item.name}</h2>
                    {item.status === "active" ? (
                      <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{cutAt90(item.description)}</p>
                  <div className="mt-auto pt-5">
                    {item.status === "active" ? (
                      <Link
                        href={item.href}
                        className="inline-flex rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
                      >
                        {item.cta}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed rounded-lg border border-zinc-700/80 bg-zinc-950/70 px-4 py-2 text-sm font-semibold text-zinc-500"
                      >
                        Under Review
                      </button>
                    )}
                </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
