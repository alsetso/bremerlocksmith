import type { Metadata } from "next"
import Link from "next/link"
import {
  Bus,
  CarFront,
  KeyRound,
  Sparkles,
  Truck,
} from "lucide-react"
import { Navigation } from "@/components/navigation"

export const metadata: Metadata = {
  title: "Services — MNISR Immediate Service Response",
  description:
    "Locksmith, towing, ditch recovery, transportation, and more. MNISR dispatches the best driver and agency for your situation.",
}

const services = [
  {
    title: "Locksmith",
    description:
      "Emergency lockouts, rekeys, hardware, and security solutions when access and safety matter most.",
    icon: KeyRound,
    accent: "from-amber-50 to-orange-50/80 border-amber-200/80",
    iconClass: "text-amber-800",
  },
  {
    title: "Towing",
    description:
      "Reliable vehicle recovery and transport when you are stranded or need a professional tow.",
    icon: Truck,
    accent: "from-slate-50 to-zinc-100/80 border-zinc-200/90",
    iconClass: "text-zinc-800",
  },
  {
    title: "Ditch Recovery",
    description:
      "Winch-out and recovery support when a vehicle leaves the roadway or needs specialized extraction.",
    icon: CarFront,
    accent: "from-emerald-50 to-teal-50/80 border-emerald-200/70",
    iconClass: "text-emerald-900",
  },
  {
    title: "Transportation",
    description:
      "Coordinated rides and logistics options aligned with your timeline and service needs.",
    icon: Bus,
    accent: "from-sky-50 to-blue-50/80 border-sky-200/80",
    iconClass: "text-sky-900",
  },
  {
    title: "Other",
    description:
      "Urgent or specialty requests outside standard categories—we still route the right responder.",
    icon: Sparkles,
    accent: "from-violet-50 to-purple-50/80 border-violet-200/70",
    iconClass: "text-violet-900",
  },
] as const

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Navigation />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:max-w-5xl lg:px-8 lg:py-14">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Services
          </p>
          <h1 className="mt-2 text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            One network. The right response.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-zinc-600">
            MNISR connects you with vetted professionals across service types. Tell us what you need—we
            handle coordination so you can focus on getting help.
          </p>

          <div className="mt-10 rounded-2xl border border-teal-200/90 bg-gradient-to-br from-teal-50/90 to-white p-6 shadow-sm sm:p-8">
            <p className="text-center text-sm font-semibold leading-relaxed text-teal-950 sm:text-base">
              Immediate Service Responders will dispatch the best driver and agency for your
              situation—matched to urgency, location, and the service you select.
            </p>
          </div>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {services.map(({ title, description, icon: Icon, accent, iconClass }) => (
              <li
                key={title}
                className={`flex flex-col rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-shadow hover:shadow-md ${accent}`}
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 shadow-sm ring-1 ring-black/5">
                  <Icon className={`h-6 w-6 ${iconClass}`} strokeWidth={1.75} aria-hidden />
                </div>
                <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-700">{description}</p>
              </li>
            ))}
          </ul>

          <div className="mt-14 flex flex-col items-center gap-4 border-t border-zinc-200 pt-10">
            <p className="text-center text-sm text-zinc-600">
              Ready to request service from the map, or return home to get started.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
              >
                Back to home
              </Link>
              <Link
                href="/"
                className="inline-flex rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-teal-400/60 hover:bg-teal-50/50"
              >
                Open map
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-zinc-200 bg-white py-4 text-center text-[11px] text-zinc-500">
        <span className="font-medium text-zinc-700">MNISR</span>
        <span className="text-zinc-400"> · </span>
        Immediate Service Response
      </footer>
    </div>
  )
}
