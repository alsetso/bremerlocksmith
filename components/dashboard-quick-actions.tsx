"use client"

import { CreditCard, Headphones, MapPin, MessageSquare, Phone } from "lucide-react"

/** Single row: icon + title only (no subtitle). */
const cardShell =
  "group flex h-11 w-full min-w-0 shrink-0 cursor-pointer touch-manipulation flex-row items-center gap-2 rounded-lg border border-zinc-600/80 bg-zinc-900/50 px-2.5 py-0 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 sm:h-12 sm:gap-2.5 sm:px-3"
const cardIcon = "pointer-events-none shrink-0"
const cardTitle =
  "pointer-events-none min-w-0 flex-1 font-serif text-[11px] font-semibold leading-tight text-zinc-100 sm:text-xs"

export interface DashboardQuickActionsProps {
  onRequestImmediateSupport: () => void
  onOpenPayments: () => void
  onOpenLocationSettings: () => void
  phoneE164: string
  /** Tighter layout for narrow drawer */
  variant?: "grid" | "list"
  /** When set, shown on the Location row (truncated). Omitted when pending without a label. */
  locationSummary?: string | null
  /** True when the user still needs to pick a meeting point. */
  locationPending?: boolean
}

export function DashboardQuickActions({
  onRequestImmediateSupport,
  onOpenPayments,
  onOpenLocationSettings,
  phoneE164,
  variant = "grid",
  locationSummary,
  locationPending = false,
}: DashboardQuickActionsProps) {
  const summary = locationSummary?.trim() ?? ""
  const locationSubtitle = locationPending
    ? "Select service location"
    : summary
      ? summary
      : null

  const grid =
    variant === "grid"
      ? "grid w-full grid-cols-3 content-start gap-x-1 gap-y-1 sm:gap-x-1.5 sm:gap-y-1.5"
      : "flex w-full flex-col gap-1.5"

  return (
    <div className={grid}>
      <button type="button" onClick={onRequestImmediateSupport} className={cardShell}>
        <span className={cardIcon}>
          <Headphones className="h-4 w-4 text-emerald-400/90 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className={cardTitle}>Immediate support</span>
      </button>
      <button
        type="button"
        onClick={onOpenLocationSettings}
        title={summary || (locationPending ? "Select service location" : "Set meeting location")}
        className={
          variant === "list"
            ? `${cardShell} min-h-[3.25rem] items-start py-2 sm:min-h-[3.5rem]`
            : cardShell
        }
      >
        <span className={variant === "list" ? `${cardIcon} mt-0.5` : cardIcon}>
          <MapPin className="h-4 w-4 text-sky-400/90 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        {variant === "list" ? (
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
            <span className="font-serif text-[11px] font-semibold leading-tight text-zinc-100 sm:text-xs">Location</span>
            {locationSubtitle ? (
              <span className="line-clamp-2 w-full text-[10px] font-normal leading-snug text-zinc-400">{locationSubtitle}</span>
            ) : (
              <span className="text-[10px] font-normal leading-snug text-zinc-500">Tap to set</span>
            )}
          </span>
        ) : (
          <span className={`${cardTitle} line-clamp-2 sm:line-clamp-2`}>
            {locationPending
              ? "Select location"
              : summary
                ? summary
                : "Location"}
          </span>
        )}
      </button>
      <a href={`tel:${phoneE164}`} className={cardShell}>
        <span className={cardIcon}>
          <Phone className="h-4 w-4 text-zinc-300 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className={cardTitle}>Call us</span>
      </a>
      <a href={`sms:${phoneE164}`} className={cardShell}>
        <span className={cardIcon}>
          <MessageSquare className="h-4 w-4 text-zinc-300 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className={cardTitle}>Text us</span>
      </a>
      <button type="button" onClick={onOpenPayments} className={cardShell}>
        <span className={cardIcon}>
          <CreditCard className="h-4 w-4 text-emerald-400/85 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className={cardTitle}>Payments</span>
      </button>
    </div>
  )
}
