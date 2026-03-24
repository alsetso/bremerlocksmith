"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import type { FormEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Menu, X } from "lucide-react"
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-browser"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/partners", label: "Partners" },
  { href: "/drivers", label: "Drivers" },
] as const

interface NavigationProps {
  userLocation?: [number, number] | null
  /** Shown under the logo when the user chose an address manually (vs. GPS reverse-geocode). */
  locationDisplayLabel?: string | null
  frameClassName?: string
}

type OverlayMode = "menu" | "auth"
type AuthMode = "sign-in" | "sign-up"

export function Navigation({ userLocation, locationDisplayLabel, frameClassName }: NavigationProps = {}) {
  const PHONE_DISPLAY = "(952) 923 0248"
  const PHONE_E164 = "+19529230248"

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("menu")
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isPhoneMenuOpen, setIsPhoneMenuOpen] = useState(false)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [headerLocation, setHeaderLocation] = useState("Minnesota, MN")
  const phoneMenuRef = useRef<HTMLDivElement>(null)
  const navMenuRef = useRef<HTMLDivElement>(null)
  const overlayPanelRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false

    const override = locationDisplayLabel?.trim()
    if (override) {
      setHeaderLocation(override)
      return
    }

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
  }, [userLocation, locationDisplayLabel])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    void supabase.auth.getSession().then(({ data }) => {
      setAuthEmail(data.session?.user?.email ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const inPhoneMenu = phoneMenuRef.current?.contains(target) ?? false
      const inNavMenu = navMenuRef.current?.contains(target) ?? false
      const inOverlayPanel = overlayPanelRef.current?.contains(target) ?? false
      if (!inPhoneMenu) setIsPhoneMenuOpen(false)
      if (!inNavMenu && !inOverlayPanel) {
        setIsMenuOpen(false)
        setOverlayMode("menu")
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => {
      const next = !prev
      if (next) setOverlayMode("menu")
      return next
    })
  }

  const handleOpenAuthOverlay = () => {
    setOverlayMode("auth")
    setAuthError(null)
    setAuthMessage(null)
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    await supabase.auth.signOut()
    setAuthMessage("Signed out.")
    setAuthError(null)
  }

  const handleBackToMenu = () => {
    setOverlayMode("menu")
    setAuthError(null)
    setAuthMessage(null)
  }

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError(null)
    setAuthMessage(null)

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setAuthError(
        "Supabase auth is not configured for browser use. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      )
      return
    }

    if (!email.trim() || !password.trim()) {
      setAuthError("Enter both email and password.")
      return
    }
    if (authMode === "sign-up" && !fullName.trim()) {
      setAuthError("Enter your name.")
      return
    }

    setIsAuthSubmitting(true)
    try {
      if (authMode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              name: fullName.trim(),
            },
          },
        })
        if (error) {
          setAuthError(error.message)
          return
        }
        setAuthMessage("Account created. Check your email to confirm sign up.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          setAuthError(error.message)
          return
        }
        setAuthMessage("Signed in successfully.")
        setIsMenuOpen(false)
      }
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  return (
    <nav className="relative z-[1200] overflow-visible bg-transparent animate-fade-in">
      <div
        className={`mx-auto w-full px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:px-8 ${
          frameClassName ?? "max-w-7xl"
        }`}
      >
        <div className="flex h-[4.25rem] items-center justify-between gap-3">
          <Link
            href="/"
            className="min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#d4c3ad]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1510]"
          >
            <h1 className="m-0 inline-flex items-center gap-2 leading-none">
              <Image
                src="/header-logo.png"
                alt=""
                aria-hidden
                width={35}
                height={35}
                className="h-[30px] w-[30px] object-contain sm:h-[35px] sm:w-[35px]"
              />
              <span className="inline-flex flex-col gap-0.5">
                <span className="font-serif text-sm font-semibold tracking-tight text-white sm:text-base md:text-lg">
                  BREMER
                </span>
                <span
                  className="max-w-[9rem] truncate text-[6px] leading-none text-zinc-200/90 sm:max-w-[12rem]"
                  title={headerLocation}
                >
                  {headerLocation}
                </span>
              </span>
            </h1>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div
              ref={phoneMenuRef}
              className="relative rounded-sm border border-zinc-700 bg-zinc-900/95 px-2.5 py-1.5 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <button
                type="button"
                onClick={() => setIsPhoneMenuOpen((s) => !s)}
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-zinc-200 hover:text-white"
                aria-haspopup="menu"
                aria-expanded={isPhoneMenuOpen}
              >
                <span>{PHONE_DISPLAY}</span>
                <span className="text-xs text-zinc-400">▾</span>
              </button>
              {isPhoneMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[9rem] rounded-sm border border-zinc-700 bg-zinc-900 p-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.45)]">
                  <a
                    href={`tel:${PHONE_E164}`}
                    className="block rounded-sm px-2.5 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800"
                  >
                    Call
                  </a>
                  <a
                    href={`sms:${PHONE_E164}`}
                    className="block rounded-sm px-2.5 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800"
                  >
                    Text
                  </a>
                </div>
              )}
            </div>

            <div ref={navMenuRef} className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMenuToggle}
                className="text-white hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[1250]">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" onClick={() => {
            setIsMenuOpen(false)
            setOverlayMode("menu")
          }} />
          <div className={`relative mx-auto h-full w-full ${frameClassName ?? "max-w-7xl"}`}>
            <div
              ref={overlayPanelRef}
              className="h-full w-full rounded-t-2xl border border-zinc-700 bg-zinc-900/98 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm animate-slide-up overflow-y-auto"
            >
              {overlayMode === "menu" ? (
                <div className="space-y-1">
                  {navItems.map(({ href, label }) => {
                    const active =
                      href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
                    return (
                      <Link
                        key={`nav-${href}`}
                        href={href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`block rounded-sm px-3 py-3 text-base font-medium ${
                        active ? "bg-zinc-700 text-white" : "text-zinc-200 hover:bg-zinc-800"
                        }`}
                      >
                        {label}
                      </Link>
                    )
                  })}
                  {authEmail ? (
                    <div className="mt-1 rounded-sm border border-zinc-700 bg-zinc-800/75 p-2">
                      <div className="text-[11px] uppercase tracking-wide text-zinc-400">Authenticated</div>
                      <div className="mt-1 truncate text-sm font-medium text-zinc-100">{authEmail}</div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="mt-2 block w-full rounded-sm border border-zinc-600 bg-zinc-900 px-3 py-2 text-left text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenAuthOverlay}
                      className="mt-1 block w-full rounded-sm border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-left text-sm font-semibold text-zinc-100 hover:bg-zinc-700"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex h-[calc(100%-2rem)] items-center justify-center">
                  <div className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-900/90 p-3">
                    <button
                      type="button"
                      onClick={handleBackToMenu}
                      className="mb-2 inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Menu
                    </button>
                    <h2 className="mb-2 text-center font-serif text-lg font-semibold text-zinc-100">
                      {authMode === "sign-up" ? "Get Started" : "Welcome Back"}
                    </h2>

                    <div className="mb-2 flex justify-center">
                      <div className="inline-flex rounded-sm border border-zinc-700 bg-zinc-800/70 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setAuthMode("sign-in")}
                        className={`rounded-sm px-2.5 py-1 ${
                          authMode === "sign-in" ? "bg-zinc-700 text-white" : "text-zinc-300"
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode("sign-up")}
                        className={`rounded-sm px-2.5 py-1 ${
                          authMode === "sign-up" ? "bg-zinc-700 text-white" : "text-zinc-300"
                        }`}
                      >
                        Sign Up
                      </button>
                      </div>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-2">
                      {authMode === "sign-up" && (
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          autoComplete="name"
                          className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                        />
                      )}
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        autoComplete="email"
                        className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete={authMode === "sign-up" ? "new-password" : "current-password"}
                        className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                      />
                      <button
                        type="submit"
                        disabled={isAuthSubmitting || !hasSupabaseBrowserConfig}
                        className="w-full rounded-sm border border-zinc-600 bg-zinc-100 px-2.5 py-2 text-sm font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isAuthSubmitting ? "Working..." : authMode === "sign-up" ? "Create Account" : "Sign In"}
                      </button>
                    </form>

                    {!hasSupabaseBrowserConfig && (
                      <p className="mt-2 text-[11px] leading-snug text-amber-700">
                        Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
                      </p>
                    )}
                    {authError && <p className="mt-2 text-[11px] leading-snug text-red-700">{authError}</p>}
                    {authMessage && <p className="mt-2 text-[11px] leading-snug text-emerald-700">{authMessage}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
