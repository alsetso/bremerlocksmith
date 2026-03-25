"use client"

import { X } from "lucide-react"
import type { MapView } from "@/lib/map-view"

type MapPageOverlayProps = {
  view: MapView
  onClose: () => void
}

const copy: Record<
  MapView,
  { label: string; title: string; body: string[]; foot?: string }
> = {
  services: {
    label: "Services",
    title: "One network. The right response.",
    body: [
      "Locksmith, towing, ditch recovery, transportation, and more—we dispatch the responder that fits your situation.",
      "Keys: custom cuts, fobs, installs, and on-site assessment when you request from the map with your location.",
    ],
    foot: "Close to return to the live map and dashboard.",
  },
  partners: {
    label: "Partners",
    title: "Digital workspace for service businesses.",
    body: [
      "Jobs, dispatch context, and customer touchpoints in one place—plus vehicle location on the map for realistic ETAs.",
      "Built for locksmith, towing, recovery, transport, and mixed fleets.",
    ],
    foot: "Close to return to the map.",
  },
  drivers: {
    label: "Drivers",
    title: "Agency, vehicle, requirements & availability.",
    body: [
      "Work under a partner agency with a registered vehicle and verified credentials before live dispatches.",
      "Set coverage, radius, and blackout times so dispatch matches what you can run.",
    ],
    foot: "Close to return to the map.",
  },
  accounts: {
    label: "Accounts",
    title: "Annual lock assessment & security plan.",
    body: [
      "Get a complimentary annual lock assessment with onsite technical review—we walk your entry points, hardware, and access patterns so you know what’s working and what could be stronger.",
      "Pair it with an annual security plan: prioritized recommendations, check-in cadence, and a clear path to upgrades or rekeys that fit your property and budget.",
    ],
    foot: "Close to return to the map and request service when you’re ready.",
  },
}

export function MapPageOverlay({ view, onClose }: MapPageOverlayProps) {
  const c = copy[view]

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[35] flex justify-center md:px-4 lg:px-6"
      role="presentation"
    >
      <div
        className="pointer-events-auto flex h-full min-h-0 w-full max-w-[800px] flex-col overflow-hidden rounded-none border-0 bg-black/92 text-zinc-100 shadow-none backdrop-blur-[2px] md:rounded-2xl md:border md:border-zinc-800/80 md:shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-view-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800/90 px-4 py-3 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{c.label}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 bg-zinc-900/90 p-2 text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Close and return to map"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-7">
          <h2 id="map-view-title" className="font-serif text-xl font-semibold leading-snug text-white sm:text-2xl">
            {c.title}
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
            {c.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {c.foot && <p className="mt-8 border-t border-zinc-800 pt-5 text-xs text-zinc-500 sm:text-sm">{c.foot}</p>}
        </div>
      </div>
    </div>
  )
}
