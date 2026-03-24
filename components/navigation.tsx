"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, MapPin } from "lucide-react"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/partners", label: "Partners" },
  { href: "/drivers", label: "Drivers" },
] as const

interface NavigationProps {
  userLocation?: [number, number] | null
}

function navLinkClass(active: boolean) {
  return [
    "text-sm font-medium transition-colors",
    active ? "text-[#4a342c]" : "text-[#5d4037]/90 hover:text-[#3e2723]",
  ].join(" ")
}

export function Navigation({ userLocation }: NavigationProps = {}) {
  const PHONE_DISPLAY = "(952) 923 0248"
  const PHONE_E164 = "+19529230248"

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPhoneMenuOpen, setIsPhoneMenuOpen] = useState(false)
  const [headerLocation, setHeaderLocation] = useState("Minnesota, MN")
  const desktopPhoneRef = useRef<HTMLDivElement>(null)
  const mobilePhoneRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false

    if (!userLocation) {
      setHeaderLocation("Minnesota, MN")
      return
    }

    const [latitude, longitude] = userLocation
    void (async () => {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        )
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return

        const city = (data.city || data.locality || "").trim()
        const stateCode = (data.principalSubdivisionCode || "").trim()
        const stateName = (data.principalSubdivision || "").trim()

        if (city && stateCode) {
          setHeaderLocation(`${city}, ${stateCode}`)
          return
        }
        if (city && stateName) {
          setHeaderLocation(`${city}, ${stateName}`)
          return
        }
        if (stateCode) {
          setHeaderLocation(stateCode === "MN" ? "Minnesota, MN" : stateCode)
          return
        }
        if (stateName) {
          setHeaderLocation(stateName)
        }
      } catch {
        /* keep fallback location label on geocode failure */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userLocation])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const inDesktop = desktopPhoneRef.current?.contains(target) ?? false
      const inMobile = mobilePhoneRef.current?.contains(target) ?? false
      if (!inDesktop && !inMobile) setIsPhoneMenuOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  return (
    <nav className="relative z-[1200] overflow-visible bg-transparent animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.25rem] items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
            <Link
              href="/"
              className="min-w-0 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#8d7b68]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2]"
            >
              <h1 className="m-0 inline-flex items-center gap-2 font-serif text-lg font-semibold tracking-tight leading-none text-[#5D4037] sm:text-xl md:text-[1.35rem]">
                <Image
                  src="/key.png"
                  alt=""
                  aria-hidden
                  width={35}
                  height={35}
                  className="h-[35px] w-[35px] object-contain"
                />
                <span>BREMER</span>
              </h1>
            </Link>

            <div className="hidden items-center gap-6 md:flex">
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

          <div className="hidden shrink-0 items-center gap-6 md:flex">
            <div
              ref={desktopPhoneRef}
              className="relative flex items-center gap-2 rounded-sm border border-[#c9b8a3] bg-[#fffef9] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
            >
              <MapPin className="h-4 w-4 shrink-0 text-[#5D4037]" aria-hidden />
              <span className="text-sm font-medium text-[#3e2723]">{headerLocation}</span>
              <span className="text-[#a89882]">·</span>
              <button
                type="button"
                onClick={() => setIsPhoneMenuOpen((s) => !s)}
                className="inline-flex items-center gap-1 text-sm text-[#4a342c] hover:text-[#3e2723]"
                aria-haspopup="menu"
                aria-expanded={isPhoneMenuOpen}
              >
                <span>{PHONE_DISPLAY}</span>
                <span className="text-xs text-[#8d7b68]">▾</span>
              </button>
              {isPhoneMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[9rem] rounded-sm border border-[#c9b8a3] bg-[#fffef9] p-1.5 shadow-[0_8px_22px_rgba(62,39,35,0.18)]">
                  <a
                    href={`tel:${PHONE_E164}`}
                    className="block rounded-sm px-2.5 py-1.5 text-sm text-[#3e2723] hover:bg-[#efe8dd]"
                  >
                    Call
                  </a>
                  <a
                    href={`sms:${PHONE_E164}`}
                    className="block rounded-sm px-2.5 py-1.5 text-sm text-[#3e2723] hover:bg-[#efe8dd]"
                  >
                    Text
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#3e2723] hover:bg-[#efe8dd]"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="animate-slide-up border-t border-[#c9b8a3] bg-[#faf7f2] md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
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
                  className={`block rounded-sm px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-[#efe8dd] text-[#3e2723]"
                      : "text-[#4a342c] hover:bg-[#f5efe6]"
                  }`}
                >
                  {label}
                </Link>
              )
            })}
            <div
              ref={mobilePhoneRef}
              className="relative mt-3 flex items-center gap-2 rounded-sm border border-[#c9b8a3] bg-[#fffef9] px-3 py-2"
            >
              <MapPin className="h-4 w-4 shrink-0 text-[#5D4037]" aria-hidden />
              <div className="text-sm">
                <div className="font-medium text-[#3e2723]">{headerLocation}</div>
                <button
                  type="button"
                  onClick={() => setIsPhoneMenuOpen((s) => !s)}
                  className="inline-flex items-center gap-1 text-[#5d4037] hover:text-[#3e2723]"
                  aria-haspopup="menu"
                  aria-expanded={isPhoneMenuOpen}
                >
                  <span>{PHONE_DISPLAY}</span>
                  <span className="text-xs text-[#8d7b68]">▾</span>
                </button>
              </div>
              {isPhoneMenuOpen && (
                <div className="absolute right-2 top-[calc(100%+0.3rem)] z-50 min-w-[8.5rem] rounded-sm border border-[#c9b8a3] bg-[#fffef9] p-1.5 shadow-[0_8px_22px_rgba(62,39,35,0.18)]">
                  <a
                    href={`tel:${PHONE_E164}`}
                    className="block rounded-sm px-2.5 py-1.5 text-sm text-[#3e2723] hover:bg-[#efe8dd]"
                  >
                    Call
                  </a>
                  <a
                    href={`sms:${PHONE_E164}`}
                    className="block rounded-sm px-2.5 py-1.5 text-sm text-[#3e2723] hover:bg-[#efe8dd]"
                  >
                    Text
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
