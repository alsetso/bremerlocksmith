"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CreditCard, Headphones, MapPin, MessageSquare, Phone, X } from "lucide-react"
import {
  FLOATING_QUICK_ACTION_IDS,
  floatingQuickActionMeta,
  type FloatingQuickActionId,
} from "@/lib/quick-actions-config"

export type { FloatingQuickActionId }

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

const ACTION_ICONS: Record<
  FloatingQuickActionId,
  { Icon: typeof Headphones; iconClass: string }
> = {
  support: { Icon: Headphones, iconClass: "text-emerald-400/95" },
  location: { Icon: MapPin, iconClass: "text-sky-400/95" },
  call: { Icon: Phone, iconClass: "text-zinc-200" },
  text: { Icon: MessageSquare, iconClass: "text-zinc-200" },
  payments: { Icon: CreditCard, iconClass: "text-emerald-400/90" },
}

const PILL_ROW = FLOATING_QUICK_ACTION_IDS.map((id) => ({
  id,
  label: floatingQuickActionMeta[id].label,
  description: floatingQuickActionMeta[id].description,
  primaryCta: floatingQuickActionMeta[id].primaryCta,
  ...ACTION_ICONS[id],
}))

/**
 * Mobile only: icon-only floating bar; the detail panel is absolutely stacked over the pill (same bottom edge).
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

  const openRow = openId ? PILL_ROW.find((a) => a.id === openId) : null

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-center px-3 md:hidden"
      aria-label="Quick actions"
    >
      <div className="pointer-events-auto flex w-full max-w-md justify-center pb-[calc(env(safe-area-inset-bottom)+4.75rem)]">
        <div className="relative w-fit max-w-[min(100vw-1.5rem,20rem)]">
          {openRow && (
            <div
              className="absolute bottom-0 left-1/2 z-20 w-[min(100vw-1.5rem,20rem)] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-2xl border border-zinc-600/90 bg-zinc-950/96 p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.06] backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby="floating-quick-title"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p id="floating-quick-title" className="font-serif text-base font-semibold text-zinc-50">
                    {openRow.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{openRow.description}</p>
                </div>
                <button
                  type="button"
                  onClick={dismissPanelToDashboard}
                  className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {openId === "support" && openRow.primaryCta && (
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      onRequestImmediateSupport()
                    }}
                    className="rounded-lg border border-emerald-600/80 bg-emerald-950/50 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-900/60"
                  >
                    {openRow.primaryCta}
                  </button>
                )}
                {openId === "location" && openRow.primaryCta && (
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      onOpenLocationSettings()
                    }}
                    className="rounded-lg border border-sky-600/80 bg-sky-950/40 px-4 py-2.5 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-900/50"
                  >
                    {openRow.primaryCta}
                  </button>
                )}
                {openId === "call" && (
                  <a
                    href={`tel:${phoneE164}`}
                    className="inline-flex rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
                  >
                    Call {phoneDisplay}
                  </a>
                )}
                {openId === "text" && (
                  <a
                    href={`sms:${phoneE164}`}
                    className="inline-flex rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
                  >
                    {openRow.primaryCta ?? "Text us"}
                  </a>
                )}
                {openId === "payments" && openRow.primaryCta && (
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      onOpenPayments()
                    }}
                    className="rounded-lg border border-emerald-600/80 bg-emerald-950/50 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-900/60"
                  >
                    {openRow.primaryCta}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="relative z-10 flex items-center gap-0.5 rounded-full border border-zinc-600/90 bg-zinc-950/92 px-1 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.05] backdrop-blur-md">
            {PILL_ROW.map(({ id, label, Icon, iconClass }) => {
              const active = openId === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  aria-label={label}
                  aria-pressed={active}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 ${
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
