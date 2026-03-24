import type { Metadata } from "next"
import Link from "next/link"
import {
  Building2,
  CarFront,
  ClipboardCheck,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"
import { Navigation } from "@/components/navigation"

export const metadata: Metadata = {
  title: "Drivers — Bremer Locksmith",
  description:
    "Join Bremer Locksmith as a field driver: choose your agency, enroll your vehicle, meet service requirements, and set availability—application opening soon.",
}

const driverSections = [
  {
    title: "Select your agency",
    description:
      "Drivers work under a partner agency on the network. When you apply, you will identify or be matched with the shop, fleet, or dispatch you roll for—so jobs, branding, and accountability stay clear.",
    icon: Building2,
  },
  {
    title: "Enroll your vehicle",
    description:
      "Register the truck or van you operate—class, equipment, and identifiers—so dispatch and customers see the right asset on the map. Live location hooks in once you are approved and opted in.",
    icon: CarFront,
  },
  {
    title: "Requirements for service",
    description:
      "Expect to show valid licensing and insurance for your trade and region, roadworthy equipment, and any trade-specific certs your agency requires. Bremer Locksmith and partner agencies verify before you take live dispatches.",
    icon: ClipboardCheck,
  },
  {
    title: "Availability",
    description:
      "Set the hours and coverage you can run—on-call windows, metro vs extended radius, and blackout times. Updates keep your agency and the network aligned with what you can actually take.",
    icon: Clock,
  },
] as const

const requirementBullets = [
  "Current driver license and insurable driving record (as required by your agency)",
  "Commercial or trade coverage and liability in line with partner policy",
  "Vehicle inspection and equipment checklist for your service type",
  "Background or credential checks where applicable for locksmith, tow, or transport work",
] as const

export default function DriversPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ebe4d8]">
      <Navigation />
      <main className="min-h-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid min-h-0 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
            {/* Left: how it works — scrollable when taller than viewport */}
            <div className="min-h-0 touch-pan-y lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:overscroll-y-contain lg:[-ms-overflow-style:none] lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6d4c41]">
                For drivers
              </p>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#3e2723] sm:text-[2.15rem] sm:leading-snug">
                Agency, vehicle, requirements & availability
              </h1>
              <p className="mt-5 text-base leading-relaxed text-[#5d4037]/95">
                Bremer Locksmith connects customers with responders through partner agencies. Here is how we set you up
                in the field—with a clear agency relationship, a registered vehicle, documented
                requirements, and availability that matches what you can deliver.
              </p>

              <div className="mt-8 rounded-sm border border-[#c9b8a3] bg-[#faf7f2] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-6">
                <div className="flex gap-3">
                  <ShieldCheck
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#5D4037]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-[#3e2723]">
                    <span className="font-semibold text-[#4a342c]">You are never anonymous on the network.</span>{" "}
                    Your agency stands behind the work; your profile ties vehicle, credentials, and schedule
                    together for safer handoffs.
                  </p>
                </div>
              </div>

              <ul className="mt-10 space-y-8">
                {driverSections.map(({ title, description, icon: Icon }) => (
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
                  Typical requirement themes
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[#5d4037]/95">
                  {requirementBullets.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#8d7b68]" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-8 text-sm leading-relaxed text-[#5d4037]/88">
                Already with a partner shop? Have your agency name ready when the application opens. New to
                the network? We will help route you to the right partner during onboarding.
              </p>
            </div>

            {/* Right: driver application — coming soon */}
            <div className="lg:sticky lg:top-6">
              <div className="relative overflow-hidden rounded-sm border border-[#c9b8a3] bg-[#fffef9] shadow-[0_2px_12px_rgba(62,39,35,0.08)]">
                <div className="border-b border-[#d7cbb8] bg-[#efe8dd]/80 px-5 py-4 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d4c41]">
                    Driver application
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-semibold text-[#3e2723]">Join as a responder</h2>
                  <p className="mt-2 text-sm text-[#5d4037]/90">
                    Link your agency, vehicle, and availability for Bremer Locksmith dispatches.
                  </p>
                </div>

                <div
                  className="pointer-events-none select-none px-5 py-6 opacity-[0.42] sm:px-6"
                  aria-hidden
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                        Partner agency
                      </label>
                      <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                          Full name
                        </label>
                        <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                          Phone
                        </label>
                        <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                        Email
                      </label>
                      <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                        Vehicle (year, make, class)
                      </label>
                      <div className="mt-1.5 h-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[#5d4037]/80">
                        Service types & availability
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
                    Driver applications open shortly
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5d4037]/95">
                    We are finishing verification flows with agencies. Check back soon—or ask your partner
                    shop for updates on Bremer Locksmith driver onboarding.
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
