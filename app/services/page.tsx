import type { Metadata } from "next"
import Link from "next/link"
import { Bus, CarFront, KeyRound, Sparkles, Truck } from "lucide-react"
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
  },
  {
    title: "Towing",
    description:
      "Reliable vehicle recovery and transport when you are stranded or need a professional tow.",
    icon: Truck,
  },
  {
    title: "Ditch Recovery",
    description:
      "Winch-out and recovery support when a vehicle leaves the roadway or needs specialized extraction.",
    icon: CarFront,
  },
  {
    title: "Transportation",
    description:
      "Coordinated rides and logistics options aligned with your timeline and service needs.",
    icon: Bus,
  },
  {
    title: "Other",
    description:
      "Urgent or specialty requests outside standard categories—we still route the right responder.",
    icon: Sparkles,
  },
] as const

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ebe4d8]">
      <Navigation />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:max-w-5xl lg:px-8 lg:py-14">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#6d4c41]">
            Services
          </p>
          <h1 className="mt-3 text-center font-serif text-3xl font-semibold tracking-tight text-[#3e2723] sm:text-[2.15rem] sm:leading-snug">
            One network. The right response.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-[#5d4037]/95">
            MNISR connects you with vetted professionals across service types. Tell us what you need—we
            handle coordination so you can focus on getting help.
          </p>

          <div className="mt-10 rounded-sm border border-[#c9b8a3] bg-[#faf7f2] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-8">
            <p className="text-center font-serif text-base font-medium leading-relaxed text-[#3e2723] sm:text-lg">
              Immediate Service Responders will dispatch the best driver and agency for your
              situation—matched to urgency, location, and the service you select.
            </p>
          </div>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {services.map(({ title, description, icon: Icon }) => (
              <li
                key={title}
                className="flex flex-col rounded-sm border border-[#c9b8a3]/90 bg-[#fffef9] p-5 shadow-[0_1px_3px_rgba(62,39,35,0.08)] transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[0_3px_10px_rgba(62,39,35,0.1)]"
              >
                <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-sm border border-[#d7cbb8] bg-[#efe8dd]">
                  <Icon className="h-[1.35rem] w-[1.35rem] text-[#5D4037]" strokeWidth={1.65} aria-hidden />
                </div>
                <h2 className="font-serif text-lg font-semibold text-[#3e2723]">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#5d4037]/92">{description}</p>
              </li>
            ))}
          </ul>

          <div className="mt-14 flex flex-col items-center gap-4 border-t border-[#c9b8a3]/80 pt-10">
            <p className="text-center text-sm text-[#5d4037]/90">
              Ready to request service from the map, or return home to get started.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex rounded-sm border border-[#4a342c] bg-[#5D4037] px-5 py-2.5 text-sm font-semibold text-[#faf7f2] shadow-sm transition-colors hover:bg-[#4a342c]"
              >
                Back to home
              </Link>
              <Link
                href="/"
                className="inline-flex rounded-sm border border-[#bdae9c] bg-[#faf7f2] px-5 py-2.5 text-sm font-semibold text-[#3e2723] shadow-sm transition-colors hover:border-[#a89882] hover:bg-[#f5efe6]"
              >
                Open map
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-[#c9b8a3] bg-[#e8dfd2] py-4 text-center text-[11px] text-[#5d4037]/85">
        <span className="font-medium text-[#4a342c]">MNISR</span>
        <span className="text-[#8d7b68]"> · </span>
        Immediate Service Response
      </footer>
    </div>
  )
}
