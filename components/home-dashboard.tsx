"use client"

import { DashboardQuickActions } from "@/components/dashboard-quick-actions"

interface HomeDashboardProps {
  onRequestImmediateSupport: () => void
  onOpenPayments: () => void
  onOpenLocationSettings: () => void
  phoneE164: string
  phoneDisplay: string
}

export function HomeDashboard({
  onRequestImmediateSupport,
  onOpenPayments,
  onOpenLocationSettings,
  phoneE164,
  phoneDisplay,
}: HomeDashboardProps) {
  return (
    <div className="flex w-full min-w-0 shrink-0 flex-col gap-1.5">
      <div className="shrink-0 space-y-0.5">
        <h2 className="font-serif text-base font-semibold leading-tight tracking-tight text-zinc-100 sm:text-lg">
          Dashboard
        </h2>
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">Quick actions</p>
      </div>
      {/* content-start + intrinsic rows — avoids huge vertical gaps from flex-1 + fr rows */}
      <DashboardQuickActions
        onRequestImmediateSupport={onRequestImmediateSupport}
        onOpenPayments={onOpenPayments}
        onOpenLocationSettings={onOpenLocationSettings}
        phoneE164={phoneE164}
        variant="grid"
      />
      <p className="shrink-0 border-t border-zinc-700/60 pt-2 text-[10px] leading-relaxed text-zinc-500 sm:pt-2.5 sm:text-[11px]">
        Minnesota born and raised—a family-owned contracting and locksmith company. We&apos;re building reliable,
        immediate routing for the urgent needs of our neighbors, because when you need help, minutes matter.
      </p>
    </div>
  )
}
