"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type {
  NexTripAgency,
  NexTripDirection,
  NexTripRoute,
  NexTripStopWithCoord,
  TransitStopMapPoint,
} from "@/lib/nextrip"

interface TransitRoutesPanelProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  vehicleRouteIds: string | null
  transitStopPath: TransitStopMapPoint[] | null
  onVehicleRouteFocus: (routeId: string | null) => void
  onTransitStopsPlotted: (points: TransitStopMapPoint[] | null) => void
}

type Phase = "browse" | "directions" | "stops"

function classifyRoute(label: string): "rail" | "brt" | "express" | "local" {
  if (/blue|green|gold|orange|red/i.test(label) && /line/i.test(label)) return "rail"
  if (/\b[A-E]\s+line/i.test(label) || /metro\s+[a-e]/i.test(label)) return "brt"
  if (parseInt(label.replace(/\D/g, ""), 10) >= 250) return "express"
  return "local"
}

const TYPE_BADGES: Record<
  ReturnType<typeof classifyRoute>,
  { label: string; className: string }
> = {
  rail: { label: "Rail", className: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200" },
  brt: { label: "BRT", className: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100" },
  express: { label: "Express", className: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100" },
  local: { label: "Local", className: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100" },
}

function toMapPoints(rows: NexTripStopWithCoord[]): TransitStopMapPoint[] {
  const out: TransitStopMapPoint[] = []
  for (const s of rows) {
    if (
      s.latitude != null &&
      s.longitude != null &&
      !Number.isNaN(s.latitude) &&
      !Number.isNaN(s.longitude) &&
      s.latitude !== 0 &&
      s.longitude !== 0
    ) {
      out.push({
        placeCode: s.place_code,
        label: s.description,
        lat: s.latitude,
        lng: s.longitude,
      })
    }
  }
  return out
}

export function TransitRoutesPanel({
  expanded,
  onExpandedChange,
  vehicleRouteIds,
  transitStopPath,
  onVehicleRouteFocus,
  onTransitStopsPlotted,
}: TransitRoutesPanelProps) {
  const [agencies, setAgencies] = useState<NexTripAgency[]>([])
  const [routes, setRoutes] = useState<NexTripRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("")
  const [expandedAgencies, setExpandedAgencies] = useState<Set<number>>(new Set())

  const [phase, setPhase] = useState<Phase>("browse")
  const [activeRoute, setActiveRoute] = useState<NexTripRoute | null>(null)
  const [directions, setDirections] = useState<NexTripDirection[]>([])
  const [directionsLoading, setDirectionsLoading] = useState(false)
  const [directionsError, setDirectionsError] = useState<string | null>(null)
  const [selectedDirection, setSelectedDirection] = useState<NexTripDirection | null>(null)
  const [stopsRows, setStopsRows] = useState<NexTripStopWithCoord[]>([])
  const [stopsLoading, setStopsLoading] = useState(false)
  const [stopsError, setStopsError] = useState<string | null>(null)

  const resetFlow = useCallback(() => {
    setPhase("browse")
    setActiveRoute(null)
    setDirections([])
    setDirectionsError(null)
    setSelectedDirection(null)
    setStopsRows([])
    setStopsError(null)
    onVehicleRouteFocus(null)
    onTransitStopsPlotted(null)
  }, [onVehicleRouteFocus, onTransitStopsPlotted])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/transportation/nextrip")
        if (!res.ok) throw new Error(`${res.status}`)
        const data = await res.json()
        if (cancelled) return
        setAgencies(data.agencies ?? [])
        setRoutes(data.routes ?? [])
        if (data.agencies?.length) {
          setExpandedAgencies(new Set([data.agencies[0].agency_id]))
        }
      } catch {
        if (!cancelled) setError("Failed to load transit routes")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const routesByAgency = useMemo(() => {
    const map = new Map<number, NexTripRoute[]>()
    for (const r of routes) {
      const arr = map.get(r.agency_id) ?? []
      arr.push(r)
      map.set(r.agency_id, arr)
    }
    return map
  }, [routes])

  const filteredAgencies = useMemo(() => {
    if (!filter.trim()) return agencies
    const q = filter.toLowerCase()
    return agencies.filter((a) => {
      if (a.agency_name.toLowerCase().includes(q)) return true
      const agencyRoutes = routesByAgency.get(a.agency_id) ?? []
      return agencyRoutes.some(
        (r) =>
          r.route_label.toLowerCase().includes(q) ||
          r.route_id.toLowerCase().includes(q),
      )
    })
  }, [agencies, filter, routesByAgency])

  const toggleAgency = useCallback((agencyId: number) => {
    setExpandedAgencies((prev) => {
      const next = new Set(prev)
      if (next.has(agencyId)) next.delete(agencyId)
      else next.add(agencyId)
      return next
    })
  }, [])

  const handleSelectRoute = useCallback(
    async (route: NexTripRoute) => {
      setActiveRoute(route)
      setDirectionsError(null)
      setDirectionsLoading(true)
      setPhase("directions")
      setDirections([])
      setSelectedDirection(null)
      setStopsRows([])
      onTransitStopsPlotted(null)
      onVehicleRouteFocus(route.route_id)

      try {
        const res = await fetch(
          `/api/transportation/nextrip?type=directions&route=${encodeURIComponent(route.route_id)}`,
        )
        if (!res.ok) throw new Error(`${res.status}`)
        const data: NexTripDirection[] = await res.json()
        if (!Array.isArray(data)) throw new Error("Invalid directions")
        setDirections(data)
      } catch {
        setDirectionsError("Could not load directions for this route.")
        setDirections([])
      } finally {
        setDirectionsLoading(false)
      }
    },
    [onVehicleRouteFocus, onTransitStopsPlotted],
  )

  const handleSelectDirection = useCallback(
    async (dir: NexTripDirection) => {
      if (!activeRoute) return
      setSelectedDirection(dir)
      setStopsRows([])
      setStopsError(null)
      setStopsLoading(true)
      setPhase("stops")

      try {
        const res = await fetch(
          `/api/transportation/nextrip?type=stops-with-coords&route=${encodeURIComponent(activeRoute.route_id)}&direction=${encodeURIComponent(String(dir.direction_id))}`,
        )
        if (!res.ok) throw new Error(`${res.status}`)
        const data: NexTripStopWithCoord[] = await res.json()
        if (!Array.isArray(data)) throw new Error("Invalid stops")
        setStopsRows(data)
        onTransitStopsPlotted(toMapPoints(data))
      } catch {
        setStopsError("Could not load stops for this direction.")
        setStopsRows([])
        onTransitStopsPlotted(null)
      } finally {
        setStopsLoading(false)
      }
    },
    [activeRoute, onTransitStopsPlotted],
  )

  const handleBackToDirections = useCallback(() => {
    setPhase("directions")
    setSelectedDirection(null)
    setStopsRows([])
    setStopsError(null)
    onTransitStopsPlotted(null)
  }, [onTransitStopsPlotted])

  const handleBackToBrowse = useCallback(() => {
    resetFlow()
  }, [resetFlow])

  const stepIndex = phase === "browse" ? 0 : phase === "directions" ? 1 : 2

  if (!expanded) {
    return (
      <div className="pointer-events-auto absolute right-3 top-3 z-[500] sm:right-4 sm:top-4">
        <button
          type="button"
          onClick={() => onExpandedChange(true)}
          className="rounded-xl border border-zinc-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-teal-800 shadow-lg backdrop-blur-sm transition-colors hover:border-teal-400/60 hover:bg-teal-50/90 sm:px-3.5 sm:py-2.5"
        >
          Show transit
        </button>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-[500] flex max-h-[min(70vh,28rem)] w-[min(100%,20rem)] flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white/95 shadow-lg backdrop-blur-sm sm:right-4 sm:top-4 sm:max-h-[min(75vh,32rem)] sm:w-[22rem]">
      <div className="border-b border-zinc-200/80 px-3 py-2.5 sm:px-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900">Transit routes</h2>
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 sm:text-xs">
              Route → direction → stops. The map updates at each step.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <button
              type="button"
              onClick={() => onExpandedChange(false)}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Hide transit
            </button>
            {(vehicleRouteIds || transitStopPath?.length) && (
              <button
                type="button"
                onClick={resetFlow}
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {activeRoute && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 sm:text-[11px]">
            <span
              className={stepIndex >= 0 ? "text-teal-700" : ""}
            >
              ① Route
            </span>
            <span className="text-zinc-300">→</span>
            <span className={stepIndex >= 1 ? "text-teal-700" : ""}>② Direction</span>
            <span className="text-zinc-300">→</span>
            <span className={stepIndex >= 2 ? "text-teal-700" : ""}>③ Stops</span>
          </div>
        )}

        {phase === "browse" && (
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter agency or route…"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            aria-label="Filter routes"
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-2.5">
        {/* Wizard: directions */}
        {phase === "directions" && activeRoute && (
          <div className="space-y-2 px-0.5">
            <button
              type="button"
              onClick={handleBackToBrowse}
              className="text-[11px] font-medium text-teal-700 hover:text-teal-900"
            >
              ← Back to routes
            </button>
            <div className="rounded-lg border border-teal-100 bg-teal-50/60 px-2.5 py-2">
              <p className="text-[11px] font-semibold text-zinc-900">{activeRoute.route_label}</p>
              <p className="font-mono text-[10px] text-zinc-500">route_id {activeRoute.route_id}</p>
            </div>
            <p className="text-[11px] text-zinc-600">
              Step 2: Choose a direction. Live buses on the map are filtered to this route.
            </p>
            {directionsLoading && <p className="text-xs text-zinc-500">Loading directions…</p>}
            {directionsError && <p className="text-xs text-red-600">{directionsError}</p>}
            {!directionsLoading &&
              !directionsError &&
              directions.map((d) => (
                <button
                  key={d.direction_id}
                  type="button"
                  onClick={() => handleSelectDirection(d)}
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-medium text-zinc-900 hover:border-teal-500 hover:bg-teal-50/50"
                >
                  <span>{d.direction_name}</span>
                  <span className="font-mono text-[10px] text-zinc-400">id {d.direction_id}</span>
                </button>
              ))}
          </div>
        )}

        {/* Wizard: stops */}
        {phase === "stops" && activeRoute && selectedDirection && (
          <div className="space-y-2 px-0.5">
            <button
              type="button"
              onClick={handleBackToDirections}
              className="text-[11px] font-medium text-teal-700 hover:text-teal-900"
            >
              ← Back to directions
            </button>
            <div className="rounded-lg border border-teal-100 bg-teal-50/60 px-2.5 py-2">
              <p className="text-[11px] font-semibold text-zinc-900">{activeRoute.route_label}</p>
              <p className="text-[11px] text-zinc-600">{selectedDirection.direction_name}</p>
            </div>
            <p className="text-[11px] text-zinc-600">
              Step 3: Stops in order along this direction. The map shows the path and stop pins when
              coordinates are available.
            </p>
            {stopsLoading && <p className="text-xs text-zinc-500">Loading stops…</p>}
            {stopsError && <p className="text-xs text-red-600">{stopsError}</p>}
            {!stopsLoading && !stopsError && stopsRows.length > 0 && (
              <ol className="list-decimal space-y-1 pl-4 text-[11px] text-zinc-800">
                {stopsRows.map((s, i) => (
                  <li key={`${s.place_code}-${i}`} className="leading-snug">
                    <span className="font-medium">{s.description}</span>
                    <span className="ml-1 font-mono text-[10px] text-zinc-400">{s.place_code}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Browse list */}
        {phase === "browse" && (
          <>
            {loading && <p className="px-1 py-2 text-xs text-zinc-500">Loading routes…</p>}
            {error && <p className="px-1 py-2 text-xs text-red-600">{error}</p>}
            {!loading && !error && (
              <div className="space-y-1.5">
                <p className="px-1 text-[11px] text-zinc-500">
                  Step 1: Expand an agency and tap a route to continue.
                </p>
                {filteredAgencies.map((agency) => {
                  const agencyRoutes = routesByAgency.get(agency.agency_id) ?? []
                  const filteredRoutes = filter.trim()
                    ? agencyRoutes.filter(
                        (r) =>
                          r.route_label.toLowerCase().includes(filter.toLowerCase()) ||
                          r.route_id.toLowerCase().includes(filter.toLowerCase()) ||
                          agency.agency_name.toLowerCase().includes(filter.toLowerCase()),
                      )
                    : agencyRoutes
                  const expanded = expandedAgencies.has(agency.agency_id)

                  return (
                    <div
                      key={agency.agency_id}
                      className="overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50/80"
                    >
                      <button
                        type="button"
                        onClick={() => toggleAgency(agency.agency_id)}
                        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs font-medium text-zinc-900 hover:bg-zinc-100/80"
                      >
                        <span className="truncate">{agency.agency_name}</span>
                        <span className="shrink-0 text-zinc-400">{expanded ? "▾" : "▸"}</span>
                      </button>
                      {expanded && filteredRoutes.length > 0 && (
                        <div className="border-t border-zinc-100 px-2 pb-2 pt-1">
                          <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto sm:max-h-none sm:grid-cols-2">
                            {filteredRoutes.map((route) => {
                              const t = classifyRoute(route.route_label)
                              const badge = TYPE_BADGES[t]
                              const isActive = activeRoute?.route_id === route.route_id
                              return (
                                <button
                                  key={route.route_id}
                                  type="button"
                                  onClick={() => handleSelectRoute(route)}
                                  className={`flex flex-col items-start gap-0.5 rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors sm:text-xs ${
                                    isActive
                                      ? "border-teal-600 bg-teal-50 text-teal-950"
                                      : "border-transparent bg-white hover:border-zinc-200 hover:bg-zinc-50"
                                  }`}
                                >
                                  <span className="line-clamp-2 font-medium leading-tight text-zinc-900">
                                    {route.route_label}
                                  </span>
                                  <span className="flex w-full flex-wrap items-center gap-1">
                                    <span className="font-mono text-[10px] text-zinc-500">
                                      {route.route_id}
                                    </span>
                                    <span
                                      className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase ${badge.className}`}
                                    >
                                      {badge.label}
                                    </span>
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {expanded && filteredRoutes.length === 0 && (
                        <p className="border-t border-zinc-100 px-2.5 py-2 text-[11px] text-zinc-500">
                          No matching routes.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
