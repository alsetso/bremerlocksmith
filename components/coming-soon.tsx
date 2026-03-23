import type { ReactNode } from "react"
import Link from "next/link"

interface ComingSoonProps {
  title: string
  description?: string
  /** Optional icon above the “Coming soon” line (e.g. Building2, Truck) */
  icon?: ReactNode
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-14 text-center sm:py-20">
      <div className="max-w-lg rounded-sm border border-[#c9b8a3] bg-[#faf7f2] px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_3px_rgba(62,39,35,0.08)] sm:px-10 sm:py-10">
        {icon ? (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-[#d7cbb8] bg-[#efe8dd]">
            {icon}
          </div>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6d4c41]">Coming soon</p>
        <h1 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-[#3e2723] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#5d4037]/95">
          {description ?? "We are building this experience. Please check back soon."}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-sm border border-[#4a342c] bg-[#5D4037] px-5 py-2.5 text-sm font-semibold text-[#faf7f2] shadow-sm transition-colors hover:bg-[#4a342c]"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
