"use client"

import { ChevronDown } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HomeDemoAdminToggle } from "@/components/home-demo-admin-toggle"
import { HomeDemoMapbox, type HomeDemoStepId } from "@/components/home-demo-mapbox"
import type { DemoGeometry } from "@/lib/home-demo-geometry"
import {
  DEFAULT_HOME_DEMO_GEOMETRY,
  ensureVehiclePath,
  isLocalhostDevHostname,
  loadHomeDemoGeometry,
  normalizeGeometry,
  saveHomeDemoGeometry,
} from "@/lib/home-demo-geometry"
import { fetchDrivingRoute, formatDriveEta, type DrivingRouteResult } from "@/lib/mapbox-directions"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ""

type GeoDemoState = "idle" | "requesting" | "ready" | "denied" | "unavailable"

type DemoStep = {
  id: HomeDemoStepId
  title: string
  description: string
  detail: string
}

const STEPS: DemoStep[] = [
  {
    id: "location",
    title: "1) Your live location",
    description: "Uses your device GPS so dispatch sees where you actually are before the service point.",
    detail: "Browser location permission required for this demo",
  },
  {
    id: "vehicles",
    title: "2) Watch live vehicle positions",
    description: "See available responders along the corridor before submitting the service request.",
    detail: "Example: Unit 12 is 6 minutes away",
  },
  {
    id: "popup",
    title: "3) Confirm request in popup",
    description: "Use a guided popup to verify location, ETA, and request details before dispatch.",
    detail: "Example: Lockout + callback number + selected entry point",
  },
]

const STEP_INDEX: Record<HomeDemoStepId, number> = {
  location: 1,
  vehicles: 2,
  popup: 3,
}

const MDN_LOCATION_HELP = "https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API#user_permission"

export function HomeDemoWorkflowSection() {
  const [active, setActive] = useState<HomeDemoStepId>("location")
  const [stepperOpen, setStepperOpen] = useState(false)
  const [locationHelpOpen, setLocationHelpOpen] = useState(false)
  const stepperWrapRef = useRef<HTMLDivElement>(null)
  const [geometry, setGeometry] = useState<DemoGeometry>(DEFAULT_HOME_DEMO_GEOMETRY)
  const [userLngLat, setUserLngLat] = useState<[number, number] | null>(null)
  const [geoState, setGeoState] = useState<GeoDemoState>("requesting")
  const [geoRetryNonce, setGeoRetryNonce] = useState(0)
  const lastCoordsRef = useRef<[number, number] | null>(null)

  const activeStep = useMemo(() => STEPS.find((s) => s.id === active) ?? STEPS[0], [active])

  const canLeaveLocationStep = geoState === "ready" && userLngLat !== null

  /** GPS pin visible on map (step 1 + fix) */
  const liveGpsOnMap = active === "location" && geoState === "ready" && userLngLat !== null

  const [step2SelectedIdx, setStep2SelectedIdx] = useState(0)
  const [step2DistanceActive, setStep2DistanceActive] = useState(false)
  const [vehiclesToUserRoute, setVehiclesToUserRoute] = useState<DrivingRouteResult | null>(null)
  const prevActiveRef = useRef<HomeDemoStepId>(active)

  const vehicleCount = geometry.vehicles.length
  const focusedVehicle = vehicleCount > 0 ? geometry.vehicles[step2SelectedIdx % vehicleCount] : undefined
  const focusedVehicleId =
    active === "vehicles" || active === "popup" ? (focusedVehicle?.id ?? null) : null

  const mapVehicleFocusStyle =
    active === "vehicles"
      ? step2DistanceActive
        ? "distance"
        : "browse"
      : vehiclesToUserRoute
        ? "distance"
        : "browse"

  useEffect(() => {
    if (active === "vehicles" && prevActiveRef.current !== "vehicles") {
      setStep2SelectedIdx(0)
      setStep2DistanceActive(false)
    }
    prevActiveRef.current = active
  }, [active])

  useEffect(() => {
    if (active === "vehicles") {
      if (!step2DistanceActive) {
        setVehiclesToUserRoute(null)
        return
      }
      if (!userLngLat || !MAPBOX_TOKEN || !focusedVehicle?.positions?.length) {
        setVehiclesToUserRoute(null)
        return
      }
      const from = focusedVehicle.positions[0]
      let cancelled = false
      ;(async () => {
        const r = await fetchDrivingRoute(from, userLngLat, MAPBOX_TOKEN)
        if (!cancelled) setVehiclesToUserRoute(r)
      })()
      return () => {
        cancelled = true
      }
    }
    if (active === "popup") {
      return
    }
    setVehiclesToUserRoute(null)
  }, [active, userLngLat, focusedVehicle?.id, step2SelectedIdx, geometry, step2DistanceActive])

  const goStep2NextUnit = useCallback(() => {
    if (vehicleCount < 1) return
    setStep2DistanceActive(false)
    setVehiclesToUserRoute(null)
    setStep2SelectedIdx((i) => (i + 1) % vehicleCount)
  }, [vehicleCount])

  useEffect(() => {
    setGeometry(loadHomeDemoGeometry())
  }, [])

  useEffect(() => {
    if (active !== "location") return
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoState("unavailable")
      return
    }
    if (lastCoordsRef.current) {
      setGeoState("ready")
    } else {
      setGeoState("requesting")
    }
    let cancelled = false
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return
        const lng = pos.coords.longitude
        const lat = pos.coords.latitude
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return
        const coords: [number, number] = [lng, lat]
        lastCoordsRef.current = coords
        setUserLngLat(coords)
        setGeoState("ready")
      },
      (err) => {
        if (cancelled) return
        if (err.code === 1) setGeoState("denied")
        else setGeoState("unavailable")
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15_000 },
    )
    return () => {
      cancelled = true
      navigator.geolocation.clearWatch(id)
    }
  }, [active, geoRetryNonce])

  /** User gesture: re-prompt / refresh fix + restart watch via nonce */
  const requestLocationAgain = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoState("unavailable")
      return
    }
    setGeoState("requesting")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude
        const lat = pos.coords.latitude
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return
        const coords: [number, number] = [lng, lat]
        lastCoordsRef.current = coords
        setUserLngLat(coords)
        setGeoState("ready")
        setGeoRetryNonce((n) => n + 1)
      },
      (err) => {
        if (err.code === 1) setGeoState("denied")
        else setGeoState("unavailable")
        setGeoRetryNonce((n) => n + 1)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    )
  }, [])

  const onGeometryChange = useCallback((g: DemoGeometry) => {
    setGeometry(g)
  }, [])

  const [adminMapVehicleId, setAdminMapVehicleId] = useState<string | null>(null)
  const [demoAdminPanelOpen, setDemoAdminPanelOpen] = useState(false)
  const [isLocalHostDev, setIsLocalHostDev] = useState(false)

  useEffect(() => {
    setIsLocalHostDev(isLocalhostDevHostname())
  }, [])

  const appendAdminWaypoint = useCallback(
    (lng: number, lat: number) => {
      if (!adminMapVehicleId) return
      setGeometry((g) => {
        const vehicles = g.vehicles.map((v) =>
          v.id === adminMapVehicleId
            ? { ...v, positions: ensureVehiclePath([...v.positions, [lng, lat]]) }
            : v,
        )
        const n = normalizeGeometry({ ...g, vehicles })
        saveHomeDemoGeometry(n)
        return n
      })
    },
    [adminMapVehicleId],
  )

  const removeAdminWaypoint = useCallback(
    (index: number) => {
      if (!adminMapVehicleId) return
      setGeometry((g) => {
        const vehicles = g.vehicles.map((v) => {
          if (v.id !== adminMapVehicleId) return v
          const next = v.positions.filter((_, i) => i !== index)
          return { ...v, positions: ensureVehiclePath(next) }
        })
        const n = normalizeGeometry({ ...g, vehicles })
        saveHomeDemoGeometry(n)
        return n
      })
    },
    [adminMapVehicleId],
  )

  useEffect(() => {
    if (!stepperOpen) return
    const onDown = (e: MouseEvent) => {
      const el = stepperWrapRef.current
      if (el && !el.contains(e.target as Node)) setStepperOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [stepperOpen])

  const locationStatusLine =
    geoState === "requesting" || geoState === "idle"
      ? "Waiting for browser location… Allow access if prompted."
      : geoState === "denied"
        ? "Location is blocked for this site."
        : "Location isn’t available in this browser."

  const step2Eta =
    vehiclesToUserRoute !== null
      ? formatDriveEta(vehiclesToUserRoute.durationSec, vehiclesToUserRoute.distanceM)
      : null

  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/45 p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-semibold tracking-tight text-zinc-50">Guided Workflow Demo</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Step 1 uses your real device location; later steps use a fixed service corridor (editable on localhost only).
      </p>

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
        <div ref={stepperWrapRef} className="absolute left-3 top-3 z-10 max-w-[min(100%-1.5rem,20rem)]">
          <div className="overflow-hidden rounded-lg border border-zinc-700/90 bg-zinc-950/95 shadow-lg backdrop-blur-sm">
            <button
              type="button"
              aria-expanded={stepperOpen}
              aria-haspopup="listbox"
              onClick={() => setStepperOpen((o) => !o)}
              className="flex w-full min-w-[12rem] items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/80"
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Step {STEP_INDEX[active]} of 3
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-zinc-100">{activeStep.title}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${stepperOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {active === "location" && geoState !== "ready" ? (
              <div className="border-t border-zinc-700/80 bg-zinc-950/90 px-3 py-2.5">
                <p className="text-xs leading-snug text-zinc-300">{locationStatusLine}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <button
                    type="button"
                    onClick={requestLocationAgain}
                    className="font-medium text-rose-400 underline decoration-rose-400/50 underline-offset-2 hover:text-rose-300"
                  >
                    Try again
                  </button>
                  <span className="text-zinc-600">·</span>
                  <a
                    href={MDN_LOCATION_HELP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sky-400/95 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-300"
                  >
                    How to enable location
                  </a>
                  <span className="text-zinc-600">·</span>
                  <button
                    type="button"
                    onClick={() => setLocationHelpOpen(true)}
                    className="font-medium text-zinc-400 underline decoration-zinc-500 underline-offset-2 hover:text-zinc-300"
                  >
                    More help
                  </button>
                </p>
              </div>
            ) : null}

            {active === "location" && canLeaveLocationStep ? (
              <div className="border-t border-zinc-700/80 bg-zinc-950/90 px-3 py-2.5">
                <p className="text-xs leading-snug text-zinc-400">
                  Your position is live on the map (violet pin). Continue when you are ready to preview corridor
                  vehicles.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActive("vehicles")
                    setStepperOpen(false)
                  }}
                  className="mt-2 w-full rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-500"
                >
                  Next
                </button>
              </div>
            ) : null}

            {active === "vehicles" ? (
              <div className="border-t border-zinc-700/80 bg-zinc-950/90 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {step2DistanceActive ? "Driving route to you" : "View all positions"}
                </p>
                <p className="mt-1 text-xs leading-snug text-zinc-400">
                  {step2DistanceActive
                    ? "Road network route and ETA from the selected unit to your live position."
                    : "No routes yet — pick a unit, then tap Get distance. Use Next unit to move on (route clears)."}
                </p>
                {isLocalHostDev ? (
                  <button
                    type="button"
                    onClick={() => setDemoAdminPanelOpen(true)}
                    className="mt-2 w-full rounded-md border border-amber-600/70 bg-amber-950/90 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-100 shadow-sm hover:bg-amber-900/85"
                  >
                    Edit demo vehicles
                  </button>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-zinc-100">
                  {focusedVehicle?.name ?? "No demo vehicles"}
                </p>
                {step2DistanceActive ? (
                  <>
                    {vehicleCount > 0 && step2Eta ? (
                      <p className="mt-2 text-xs leading-snug text-zinc-300">
                        <span className="text-rose-300/95">{step2Eta.timeStr}</span>
                        <span className="text-zinc-600"> · </span>
                        {step2Eta.distStr} to you via roads (Mapbox Directions)
                      </p>
                    ) : vehicleCount > 0 ? (
                      <p className="mt-2 text-xs text-zinc-500">
                        {!MAPBOX_TOKEN
                          ? "Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN for driving ETA."
                          : "Computing driving route…"}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setStep2DistanceActive(false)}
                      className="mt-2 w-full rounded-md border border-zinc-600 bg-zinc-900 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                    >
                      Back to overview
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!MAPBOX_TOKEN || vehicleCount < 1 || !focusedVehicle?.positions?.length}
                    onClick={() => setStep2DistanceActive(true)}
                    className="mt-2 w-full rounded-md border border-rose-500/50 bg-rose-950/50 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-950/80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Get distance
                  </button>
                )}
                {vehicleCount > 0 ? (
                  <ul className="mt-2 max-h-[min(28vh,8rem)] space-y-1 overflow-y-auto border-t border-zinc-800/80 pt-2">
                    {geometry.vehicles.map((v, i) => {
                      const on = vehicleCount > 0 && i === step2SelectedIdx % vehicleCount
                      return (
                        <li key={v.id} className="list-none">
                          <button
                            type="button"
                            onClick={() => {
                              setStep2SelectedIdx(i)
                              setStep2DistanceActive(false)
                            }}
                            className={`w-full truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                              on
                                ? "border border-sky-500/40 bg-sky-950/40 font-medium text-sky-100"
                                : "border border-transparent text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                            }`}
                          >
                            {on ? "Selected · " : ""}
                            {v.name}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
                {vehicleCount > 1 ? (
                  <button
                    type="button"
                    onClick={goStep2NextUnit}
                    className="mt-2 w-full rounded-md border border-zinc-600 bg-zinc-900 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                  >
                    Next unit
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setActive("popup")
                    setStepperOpen(false)
                  }}
                  className="mt-2 w-full rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-500"
                >
                  Next
                </button>
              </div>
            ) : null}

            {stepperOpen ? (
              <ul
                role="listbox"
                className="max-h-[min(60vh,22rem)] overflow-y-auto border-t border-zinc-700/80 bg-zinc-950/98 py-1"
              >
                {STEPS.map((step) => {
                  const selected = step.id === active
                  const locked = step.id !== "location" && !canLeaveLocationStep
                  return (
                    <li key={step.id} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        disabled={locked}
                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                          locked
                            ? "cursor-not-allowed opacity-45"
                            : selected
                              ? "bg-rose-500/15 text-zinc-50"
                              : "text-zinc-300 hover:bg-zinc-800/80"
                        }`}
                        onClick={() => {
                          if (locked) return
                          setActive(step.id)
                          setStepperOpen(false)
                        }}
                      >
                        <span className="font-semibold">{step.title}</span>
                        {locked ? (
                          <span className="mt-1 block text-xs text-zinc-500">Allow location in step 1 first</span>
                        ) : (
                          <span className="mt-1 block text-xs leading-snug text-zinc-500">{step.description}</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        </div>

        <div
          className={`pointer-events-none absolute right-14 top-3 z-10 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] shadow backdrop-blur-sm ${
            liveGpsOnMap
              ? "border border-red-500/70 bg-red-950/90 text-red-200 ring-1 ring-red-500/30"
              : "border border-zinc-700/90 bg-zinc-950/90 text-zinc-300"
          }`}
        >
          Live
        </div>

        <HomeDemoAdminToggle
          geometry={geometry}
          onGeometryChange={onGeometryChange}
          mapEditVehicleId={adminMapVehicleId}
          onMapEditVehicleChange={setAdminMapVehicleId}
          panelOpen={demoAdminPanelOpen}
          onPanelOpenChange={setDemoAdminPanelOpen}
        />

        <HomeDemoMapbox
          activeStep={active}
          popupTitle={activeStep.title}
          popupDetail={activeStep.detail}
          geometry={geometry}
          userLngLat={userLngLat}
          adminMapVehicleId={adminMapVehicleId}
          onAdminAppendWaypoint={appendAdminWaypoint}
          onAdminRemoveWaypoint={removeAdminWaypoint}
          vehiclesToUserRoute={vehiclesToUserRoute}
          focusedVehicleId={focusedVehicleId}
          vehicleFocusStyle={mapVehicleFocusStyle}
          className="rounded-none border-0"
        />
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Production stack: Mapbox GL (same token as <code className="text-zinc-400">/map</code>). Corridor points are
        defaults unless you override them in localhost dev tools.
      </p>

      {locationHelpOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-demo-location-help-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLocationHelpOpen(false)
          }}
        >
          <div className="max-h-[min(90vh,28rem)] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
            <h3 id="home-demo-location-help-title" className="font-serif text-lg font-semibold text-zinc-50">
              Allow location in your browser
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              This demo needs your real GPS position on step 1. Browsers only show the permission prompt when the page
              asks (for example after you tap <span className="text-zinc-200">Try again</span>).
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-400">
              <li>
                <span className="text-zinc-300">Chrome / Edge:</span> site settings → Location → Allow.{" "}
                <a
                  href="https://support.google.com/chrome/answer/142065"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
                >
                  Google help
                </a>
              </li>
              <li>
                <span className="text-zinc-300">Safari (Mac):</span>{" "}
                <a
                  href="https://support.apple.com/guide/mac-help/allow-or-deny-location-services-mchlp2096/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
                >
                  Apple guide
                </a>
              </li>
              <li>
                <span className="text-zinc-300">Firefox:</span>{" "}
                <a
                  href="https://support.mozilla.org/en-US/kb/does-firefox-share-my-location-websites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
                >
                  Mozilla help
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Technical reference:{" "}
              <a
                href={MDN_LOCATION_HELP}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500/90 underline underline-offset-2 hover:text-sky-400"
              >
                MDN — Geolocation API
              </a>
            </p>
            <button
              type="button"
              onClick={() => setLocationHelpOpen(false)}
              className="mt-4 w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
