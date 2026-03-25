"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

export function HomeHeroSection() {
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setMounted(true)
    const root = document.querySelector<HTMLElement>("[data-app-scroll-root]")
    const target: HTMLElement | Window = root ?? window
    const read = () => {
      setScrollY(root ? root.scrollTop : window.scrollY)
    }
    read()
    target.addEventListener("scroll", read, { passive: true })
    return () => target.removeEventListener("scroll", read as EventListener)
  }, [])

  const progress = useMemo(() => Math.min(1, Math.max(0, scrollY / 260)), [scrollY])
  const contentStyle = useMemo(
    () => ({
      opacity: 1 - progress * 0.55,
      transform: `translateY(${progress * 36}px) scale(${1 - progress * 0.03})`,
    }),
    [progress],
  )

  const enter = mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"

  return (
    <section className="relative overflow-hidden bg-zinc-950 px-6 py-10 sm:px-10 sm:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(244,114,182,0.16),transparent_40%),radial-gradient(circle_at_84%_20%,rgba(251,146,60,0.12),transparent_38%)]" />
      <div className="relative transition-transform duration-75" style={contentStyle}>
        <h1
          className={`mx-auto mt-6 max-w-4xl text-center font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-100 transition-all duration-700 sm:text-5xl lg:text-6xl ${enter}`}
        >
          The Standard for
          <span className="px-2 font-serif italic text-rose-300">Immediate</span>
          Response in Minnesota.
        </h1>

        <span
          className={`mx-auto mt-6 block h-px w-16 bg-rose-400/80 transition-all delay-75 duration-700 ${enter}`}
        />

        <p
          className={`mx-auto mt-6 max-w-4xl text-center text-lg leading-relaxed text-zinc-300 transition-all delay-100 duration-700 sm:text-[1.75rem] sm:leading-relaxed sm:tracking-tight ${enter}`}
        >
          Bremer dispatch coordinates locksmith, roadside, and field support on your behalf - with live location context
          and a workflow that keeps you in control of every decision.
        </p>

        <div className={`mt-8 flex flex-wrap justify-center gap-2 transition-all delay-150 duration-700 ${enter}`}>
          {["Legacy", "Serif Authority", "Evergreen", "High Trust"].map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className={`mt-7 flex flex-wrap justify-center gap-2 transition-all delay-200 duration-700 ${enter}`}>
          <Link
            href="/map"
            className="rounded-lg border border-rose-400/70 bg-rose-500/20 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/30"
          >
            Open live map
          </Link>
          <Link
            href="/integrations"
            className="rounded-lg border border-zinc-400/50 bg-zinc-900/55 px-4 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800/70"
          >
            View integrations
          </Link>
        </div>
      </div>
    </section>
  )
}
