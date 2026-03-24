"use client"

import { useState } from "react"
import { CreditCard, Headphones, MapPin, MessageSquare, Phone } from "lucide-react"
import { PaymentsModal } from "@/components/payments-modal"

/** Single row: icon + title only (no subtitle). Compact height; grid row height is intrinsic — not stretched by parent flex. */
const cardShell =
  "group flex h-11 w-full min-w-0 shrink-0 cursor-pointer touch-manipulation flex-row items-center gap-2 rounded-lg border border-zinc-600/80 bg-zinc-900/50 px-2.5 py-0 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 sm:h-12 sm:gap-2.5 sm:px-3"
const cardIcon = "pointer-events-none shrink-0"
const cardTitle =
  "pointer-events-none min-w-0 flex-1 font-serif text-[11px] font-semibold leading-tight text-zinc-100 sm:text-xs"

interface HomeDashboardProps {
  onRequestImmediateSupport: () => void
  onOpenLocationSettings: () => void
  phoneE164: string
  phoneDisplay: string
}

export function HomeDashboard({
  onRequestImmediateSupport,
  onOpenLocationSettings,
  phoneE164,
  phoneDisplay,
}: HomeDashboardProps) {
  const [paymentsOpen, setPaymentsOpen] = useState(false)

  return (
    <div className="flex w-full min-w-0 shrink-0 flex-col gap-1.5">
      <div className="shrink-0 space-y-0.5">
        <h2 className="font-serif text-base font-semibold leading-tight tracking-tight text-zinc-100 sm:text-lg">
          Dashboard
        </h2>
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">Quick actions</p>
      </div>
      {/* content-start + intrinsic rows — avoids huge vertical gaps from flex-1 + fr rows */}
      <div className="grid w-full grid-cols-3 content-start gap-x-1 gap-y-1 sm:gap-x-1.5 sm:gap-y-1.5">
        <button type="button" onClick={onRequestImmediateSupport} className={cardShell}>
          <span className={cardIcon}>
            <Headphones className="h-4 w-4 text-emerald-400/90 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
          </span>
          <span className={cardTitle}>Immediate support</span>
        </button>
        <button type="button" onClick={onOpenLocationSettings} className={cardShell}>
          <span className={cardIcon}>
            <MapPin className="h-4 w-4 text-sky-400/90 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
          </span>
          <span className={cardTitle}>Location</span>
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
        <button type="button" onClick={() => setPaymentsOpen(true)} className={cardShell}>
          <span className={cardIcon}>
            <CreditCard className="h-4 w-4 text-emerald-400/85 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
          </span>
          <span className={cardTitle}>Payments</span>
        </button>
      </div>
      <PaymentsModal isOpen={paymentsOpen} onClose={() => setPaymentsOpen(false)} />
      <p className="shrink-0 border-t border-zinc-700/60 pt-2 text-[10px] leading-relaxed text-zinc-500 sm:pt-2.5 sm:text-[11px]">
        Minnesota born and raised—a family-owned contracting and locksmith company. We&apos;re building reliable,
        immediate routing for the urgent needs of our neighbors, because when you need help, minutes matter.
      </p>
    </div>
  )
}
