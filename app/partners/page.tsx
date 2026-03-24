import type { Metadata } from "next"
import Link from "next/link"
import {
  LayoutDashboard,
  MapPinned,
  Layers,
  Radio,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"
import { Navigation } from "@/components/navigation"

export const metadata: Metadata = {
  title: "Partners — Bremer Locksmith",
  description:
    "Bremer Locksmith partners with service-business owners across locksmith, towing, recovery, transport, and more—digital workspace and live vehicle location in one place.",
}

const pillars = [
  {
    title: "Digital workspace",
    description:
      "One place for jobs, dispatch context, and customer touchpoints—so your team spends less time on paperwork and more time in the field.",
    icon: LayoutDashboard,
  },
  {
    title: "Vehicle location integration",
    description:
      "Tie responder vehicles to the map for realistic ETAs, routing awareness, and calmer handoffs between your office and drivers.",
    icon: MapPinned,
  },
  {
    title: "Built for every service type",
    description:
      "Whether you run locksmith vans, wreckers, ditch rigs, or mixed fleets, the same workspace adapts to how your business operates.",
    icon: Layers,
  },
  {
    title: "Operational visibility",
    description:
      "See who is moving, where demand is clustering, and how requests flow—without juggling five different apps.",
    icon: Radio,
  },
] as const

const serviceTypes = [
  "Locksmith & access",
  "Towing & recovery",
  "Ditch / winch-out",
  "Transportation & logistics",
  "Other urgent or specialty response",
] as const

export default function PartnersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ebe4d8]">
      <Navigation />
      <main className="min-h-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid min-h-0 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
            {/* Left: narrative — scrollable when taller than viewport */}
            <div className="min-h-0 touch-pan-y lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:overscroll-y-contain lg:[-ms-overflow-style:none] lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6d4c41]">
                For business owners
              </p>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#3e2723] sm:text-[2.15rem] sm:leading-snug">
                Equip your operation with our digital workspace
              </h1>
              <p className="mt-5 text-base leading-relaxed text-[#5d4037]/95">
                Bremer Locksmith works with owners across service categories—not just one trade. We are building tools
                that connect your brand, your dispatch picture, and live vehicle location so customers get
                clear answers and your crews stay coordinated.
              </p>

              <div className="mt-8 rounded-sm border border-[#c9b8a3] bg-[#faf7f2] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-6">
                <div className="flex gap-3">
                  <ShieldCheck
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#5D4037]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-[#3e2723]">
                    <span className="font-semibold text-[#4a342c]">Partner-ready, not one-size-fits-all.</span>{" "}
                    Tell us how your shop or fleet runs—we align the workspace and integrations to your
                    workflows as we onboard teams.
                  </p>
                </div>
              </div>

              <ul className="mt-10 space-y-8">
                {pillars.map(({ title, description, icon: Icon }) => (
                  <li key={title} className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-[#d7cbb8] bg-[#efe8dd]">
                      <Icon className="h-[1.35rem] w-[1.35rem] text-[#5D4037]" strokeWidth={1.65} aria-hidden />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-semibold text-[#3e2723]">{title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-[#5d4037]/92">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10 rounded-sm border border-[#c9b8a3]/90 bg-[#fffef9] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d4c41]">
                  Who we are speaking with
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[#5d4037]/95">
                  {serviceTypes.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#8d7b68]" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-8 text-sm leading-relaxed text-[#5d4037]/88">
                Questions before you apply? Use the same flow your customers use from the home map—we will
                route enterprise and partner conversations from there as we expand contact options.
              </p>
            </div>

            {/* Right: application — coming soon */}
            <div className="lg:sticky lg:top-6">
              <div className="relative overflow-hidden rounded-sm border border-[#c9b8a3] bg-[#fffef9] shadow-[0_2px_12px_rgba(62,39,35,0.08)]">
                <div className="border-b border-[#d7cbb8] bg-[#efe8dd]/80 px-5 py-4 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d4c41]">
                    Partner application
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-semibold text-[#3e2723]">Join the network</h2>
                  <p className="mt-2 text-sm text-[#5d4037]/90">
                    Request access to the business workspace and vehicle integrations.
                  </p>
                </div>

                <div
                  className="pointer-events-none select-none px-5 py-6 opacity-[0.42] sm:px-6"
                  aria-hidden
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                        Business name
                      </label>
                      <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                          Your name
                        </label>
                        <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                          Role
                        </label>
                        <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                        Work email
                      </label>
                      <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                        Phone
                      </label>
                      <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                        Tell us about your fleet or coverage area
                      </label>
                      <div className="mt-1.5 h-24 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#faf7f2]/88 px-6 text-center backdrop-blur-[2px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6d4c41]">
                    Coming soon
                  </p>
                  <p className="mt-3 max-w-[16rem] font-serif text-lg font-semibold text-[#3e2723]">
                    Partner applications open shortly
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5d4037]/95">
                    We are finalizing onboarding and verification. Check back soon—or reach out through your
                    usual Bremer Locksmith channels when available.
                  </p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="inline-flex text-sm font-medium text-[#4a342c] underline decoration-[#bdae9c] underline-offset-4 hover:text-[#3e2723]"
                >
                  Back to home & map
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-[#c9b8a3] bg-[#e8dfd2] py-4 text-center text-[11px] text-[#5d4037]/85">
        <span className="font-medium text-[#4a342c]">BREMER</span>
      </footer>
    </div>
  )
}
