import Link from "next/link"

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Coming soon</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
        {description ?? "We are building this experience. Please check back soon."}
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex items-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:border-teal-600/40 hover:bg-teal-50/50"
      >
        Back to home
      </Link>
    </main>
  )
}
