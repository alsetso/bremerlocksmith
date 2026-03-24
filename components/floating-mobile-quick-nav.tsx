"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CreditCard, Headphones, MapPin, MessageSquare, Phone, X } from "lucide-react"

export type FloatingQuickActionId = "support" | "location" | "call" | "text" | "payments"

export type FloatingMobileQuickNavProps = {
  onRequestImmediateSupport: () => void
  onOpenPayments: () => void
  onOpenLocationSettings: () => void
  phoneE164: string
  phoneDisplay: string
  /** When false, nothing is rendered (e.g. map view overlay or location wizard). */
  enabled?: boolean
  /** When the detail panel is dismissed (X, outside tap, or toggling the active icon off)—e.g. expand map bottom sheet to dashboard. Not called when using a primary CTA that opens another flow. */
  onClosePanelDismiss?: () => void
}

const ACTIONS: {
  id: FloatingQuickActionId
  label: string
  Icon: typeof Headphones
  iconClass: string
}[] = [
  { id: "support", label: "Immediate support", Icon: Headphones, iconClass: "text-emerald-400/95" },
  { id: "location", label: "Location", Icon: MapPin, iconClass: "text-sky-400/95" },
  { id: "call", label: "Call", Icon: Phone, iconClass: "text-zinc-200" },
  { id: "text", label: "Text", Icon: MessageSquare, iconClass: "text-zinc-200" },
  { id: "payments", label: "Payments", Icon: CreditCard, iconClass: "text-emerald-400/90" },
]

/**
 * Mobile only: icon-only floating bar; the detail panel is absolutely stacked over the pill (same bottom edge, z-20).
 */
export function FloatingMobileQuickNav({
  onRequestImmediateSupport,
  onOpenPayments,
  onOpenLocationSettings,
  phoneE164,
  phoneDisplay,
  enabled = true,
  onClosePanelDismiss,
}: FloatingMobileQuickNavProps) {
  const [openId, setOpenId] = useState<FloatingQuickActionId | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const openIdRef = useRef<FloatingQuickActionId | null>(null)
  openIdRef.current = openId

  /** Close without restoring dashboard (e.g. before opening service / payments flow). */
  const close = useCallback(() => setOpenId(null), [])

  const dismissPanelToDashboard = useCallback(() => {
    setOpenId(null)
    onClosePanelDismiss?.()
  }, [onClosePanelDismiss])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (openIdRef.current === null) return
      onClosePanelDismiss?.()
      setOpenId(null)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("touchstart", onPointerDown, { passive: true })
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("touchstart", onPointerDown)
    }
  }, [onClosePanelDismiss])

  const toggle = (id: FloatingQuickActionId) => {
    setOpenId((prev) => {
      if (prev === id) {
        onClosePanelDismiss?.()
        return null
      }
      return id
    })
  }

  if (!enabled) return null

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-center px-3 md:hidden"
      aria-label="Quick actions"
    >
      <div className="pointer-events-auto flex w-full max-w-md justify-center pb-[calc(env(safe-area-inset-bottom)+4.75rem)]">
        {/* Inner box: icon pill + popup share bottom edge; popup stacks on top (z-20) over the icons (z-10). */}
        <div className="relative w-fit max-w-[min(100vw-1.5rem,20rem)]">
          {openId && (
            <div
              className="absolute bottom-0 left-1/2 z-20 w-[min(100vw-1.5rem,20rem)] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-2xl border border-zinc-600/90 bg-zinc-950/95 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby="floating-quick-title"
            >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p id="floating-quick-title" className="font-serif text-base font-semibold text-zinc-50">
                  {ACTIONS.find((a) => a.id === openId)?.label}
                </p>
                <div className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {openId === "support" && (
                    <p>Start a service request with your meeting location—we’ll route the right responder.</p>
                  )}
                  {openId === "location" && (
                    <p>Set or adjust where we should meet you on the map.</p>
                  )}
                  {openId === "call" && <p>Speak with dispatch now.</p>}
                  {openId === "text" && <p>Send a text to our line—we reply when available.</p>}
                  {openId === "payments" && <p>Cards, invoices, and payment status.</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={dismissPanelToDashboard}
                className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {openId === "support" && (
                <button
                  type="button"
                  onClick={() => {
                    close()
                    onRequestImmediateSupport()
                  }}
                  className="rounded-lg border border-emerald-600/80 bg-emerald-950/50 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-900/60"
                >
                  Request support
                </button>
              )}
              {openId === "location" && (
                <button
                  type="button"
                  onClick={() => {
                    close()
                    onOpenLocationSettings()
                  }}
                  className="rounded-lg border border-sky-600/80 bg-sky-950/40 px-4 py-2.5 text-sm font-semibold text-sky-100 hover:bg-sky-900/50"
                >
                  Open location
                </button>
              )}
              {openId === "call" && (
                <a
                  href={`tel:${phoneE164}`}
                  className="inline-flex rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
                >
                  Call {phoneDisplay}
                </a>
              )}
              {openId === "text" && (
                <a
                  href={`sms:${phoneE164}`}
                  className="inline-flex rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
                >
                  Text us
                </a>
              )}
              {openId === "payments" && (
                <button
                  type="button"
                  onClick={() => {
                    close()
                    onOpenPayments()
                  }}
                  className="rounded-lg border border-emerald-600/80 bg-emerald-950/50 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-900/60"
                >
                  Open payments
                </button>
              )}
            </div>
          </div>
          )}

          <div className="relative z-10 flex items-center gap-0.5 rounded-full border border-zinc-600/90 bg-zinc-950/90 px-1 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
            {ACTIONS.map(({ id, label, Icon, iconClass }) => {
              const active = openId === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  aria-label={label}
                  aria-pressed={active}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors touch-manipulation ${
                    active ? "bg-zinc-700 text-white" : "text-zinc-300 hover:bg-zinc-800/90"
                  }`}
                >
                  <Icon className={`h-[1.15rem] w-[1.15rem] ${iconClass}`} strokeWidth={1.85} aria-hidden />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
