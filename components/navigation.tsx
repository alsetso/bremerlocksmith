"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, MapPin } from "lucide-react"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/agencies", label: "Agencies" },
  { href: "/drivers", label: "Drivers" },
] as const

function navLinkClass(active: boolean) {
  return [
    "text-sm font-medium transition-colors",
    active ? "text-teal-700" : "text-zinc-700 hover:text-zinc-900",
  ].join(" ")
}

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-zinc-200/90 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
            <Link href="/" className="flex-shrink-0 min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40">
              <h1 className="flex flex-col items-start gap-[5px] p-0 m-0">
                <span className="inline-flex items-baseline gap-1 text-base sm:text-lg md:text-xl font-bold tracking-tight leading-none">
                  <span className="text-[#5D4037]">MN</span>
                  <span className="text-[#8B7355]">ISR</span>
                </span>
                <span className="text-[5px] font-medium text-zinc-800 leading-none tracking-wide">
                  Immediate Service Response
                </span>
              </h1>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navItems.map(({ href, label }) => {
                const active =
                  href === "/"
                    ? pathname === "/"
                    : pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link key={href} href={href} className={navLinkClass(active)}>
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2 border border-zinc-200 rounded-lg px-3 py-1.5 bg-zinc-50/80">
              <MapPin className="w-4 h-4 text-zinc-700" />
              <span className="text-sm text-zinc-900 font-medium">Minneapolis, MN</span>
              <span className="text-zinc-400">·</span>
              <span className="text-sm text-zinc-800">(612) 555-0100</span>
            </div>
          </div>

          <div className="md:hidden shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-zinc-900 hover:bg-zinc-100">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 animate-slide-up bg-white">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navItems.map(({ href, label }) => {
              const active =
                href === "/"
                  ? pathname === "/"
                  : pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active ? "bg-teal-50 text-teal-800" : "text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  {label}
                </Link>
              )
            })}
            <div className="mt-3 flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-lg bg-zinc-50/80">
              <MapPin className="w-4 h-4 text-zinc-700 shrink-0" />
              <div className="text-sm">
                <div className="text-zinc-900 font-medium">Minneapolis, MN</div>
                <div className="text-zinc-700">(612) 555-0100</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
