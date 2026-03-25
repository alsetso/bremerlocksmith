"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { fetchDrivingRoute, formatDriveEta, type DrivingRouteResult } from "@/lib/mapbox-directions"
import type { DemoGeometry } from "@/lib/home-demo-geometry"

export type HomeDemoStepId = "location" | "vehicles" | "popup"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

const LINES_SOURCE = "demo-vehicles-lines"
const LINES_LAYER = "demo-vehicles-lines-layer"
const STOPS_SOURCE = "demo-vehicle-stops"
const STOPS_LAYER = "demo-vehicle-stops-layer"
const DIRECTIONS_SOURCE = "demo-step2-driving-route"
const DIRECTIONS_LAYER = "demo-step2-driving-route-layer"

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function buildStopPopupInitialHtml(
  name: string,
  stopIndexOneBased: number,
  stopCount: number,
  refreshMs: number,
) {
  return `<div style="padding:10px 12px;font-family:ui-sans-serif,system-ui,sans-serif;color:#e4e4e7">
    <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#a1a1aa">Demo stop</p>
    <p style="margin:6px 0 0;font-size:15px;font-weight:600;color:#fafafa">${escapeHtml(name)}</p>
    <p style="margin:6px 0 0;font-size:12px;color:#d4d4d8">Stop ${stopIndexOneBased} of ${stopCount} · refresh every <strong>${escapeHtml(String(refreshMs))}</strong> ms</p>
    <p style="margin:8px 0 0;font-size:11px;color:#a1a1aa;line-height:1.45">Request uses <strong>this pin’s</strong> coordinates as the start, and <strong>your live GPS</strong> as the destination (demo).</p>
    <button type="button" data-demo-request-service style="margin-top:10px;width:100%;border-radius:8px;border:none;background:#e11d48;color:#fff;font-size:13px;font-weight:600;padding:8px 10px;cursor:pointer">Request service</button>
  </div>`
}

function buildStopPopupEtaHtml(name: string, timeStr: string, distStr: string) {
  return `<div style="padding:10px 12px;font-family:ui-sans-serif,system-ui,sans-serif;color:#e4e4e7">
    <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#a1a1aa">Driving to you</p>
    <p style="margin:6px 0 0;font-size:15px;font-weight:600;color:#fafafa">${escapeHtml(name)}</p>
    <p style="margin:10px 0 0;font-size:13px;color:#fafafa">From this stop to your location: <span style="color:#fda4af">${escapeHtml(timeStr)}</span> · ${escapeHtml(distStr)}</p>
    <p style="margin:6px 0 0;font-size:11px;color:#a1a1aa">Mapbox driving directions (roads).</p>
  </div>`
}

function buildStopPopupNoUserHtml(name: string) {
  return `<div style="padding:10px 12px;font-family:ui-sans-serif,system-ui,sans-serif;color:#e4e4e7">
    <p style="margin:0;font-size:15px;font-weight:600;color:#fafafa">${escapeHtml(name)}</p>
    <p style="margin:8px 0 0;font-size:12px;color:#fca5a5">Allow location in step 1 so we can route to your GPS position.</p>
  </div>`
}

function buildStopPopupNoTokenHtml() {
  return `<div style="padding:10px 12px;font-size:12px;color:#fca5a5">Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN for driving ETA.</div>`
}

function buildStopPopupRouteErrorHtml() {
  return `<div style="padding:10px 12px;font-size:12px;color:#fca5a5">Could not compute a driving route for this demo.</div>`
}

interface HomeDemoMapboxProps {
  activeStep: HomeDemoStepId
  popupTitle: string
  popupDetail: string
  geometry: DemoGeometry
  userLngLat: [number, number] | null
  /** Localhost admin: pick waypoints on the map for this vehicle id */
  adminMapVehicleId?: string | null
  onAdminAppendWaypoint?: (lng: number, lat: number) => void
  onAdminRemoveWaypoint?: (index: number) => void
  /** Step 2+: Mapbox driving route from focused vehicle → user (roads) */
  vehiclesToUserRoute?: DrivingRouteResult | null
  /** Step 2+: selected unit (list + map) */
  focusedVehicleId?: string | null
  /** browse = selected unit uses a soft highlight; distance = rose highlight while route / ETA is active */
  vehicleFocusStyle?: "browse" | "distance"
  className?: string
}

function allCoordsForBounds(g: DemoGeometry): [number, number][] {
  const out: [number, number][] = [g.designated]
  for (const v of g.vehicles) {
    for (const p of v.positions) out.push(p)
  }
  return out
}

type StopKind = "inactive" | "active" | "focusedBrowse" | "focusedDistance"

function computeStopKind(
  vehicleId: string,
  stopIdx: number,
  activeIdx: number,
  focusedVehicleId: string | null,
  vehicleFocusStyle: "browse" | "distance",
): StopKind {
  const isActive = stopIdx === activeIdx
  const isFocused = focusedVehicleId === vehicleId
  if (isActive && isFocused) {
    return vehicleFocusStyle === "distance" ? "focusedDistance" : "focusedBrowse"
  }
  if (isActive) return "active"
  return "inactive"
}

function buildVehicleStopsGeoJSON(
  g: DemoGeometry,
  activeByVehicle: Record<string, number>,
  focusedVehicleId: string | null,
  vehicleFocusStyle: "browse" | "distance",
) {
  const features: Array<{
    type: "Feature"
    id: string
    properties: {
      kind: StopKind
      vehicleId: string
      name: string
      stopIndex: number
      stopCount: number
      refreshMs: number
    }
    geometry: { type: "Point"; coordinates: [number, number] }
  }> = []
  for (const v of g.vehicles) {
    const activeIdx = activeByVehicle[v.id] ?? 0
    v.positions.forEach((pos, idx) => {
      const kind = computeStopKind(v.id, idx, activeIdx, focusedVehicleId, vehicleFocusStyle)
      features.push({
        type: "Feature",
        id: `${v.id}:${idx}`,
        properties: {
          kind,
          vehicleId: v.id,
          name: v.name,
          stopIndex: idx,
          stopCount: v.positions.length,
          refreshMs: v.positionRefreshMs,
        },
        geometry: { type: "Point", coordinates: pos },
      })
    })
  }
  return { type: "FeatureCollection" as const, features }
}

function syncVehicleStopsData(
  map: mapboxgl.Map,
  g: DemoGeometry,
  activeByVehicle: Record<string, number>,
  focusedVehicleId: string | null,
  vehicleFocusStyle: "browse" | "distance",
) {
  const src = map.getSource(STOPS_SOURCE) as mapboxgl.GeoJSONSource | undefined
  if (!src) return
  src.setData(buildVehicleStopsGeoJSON(g, activeByVehicle, focusedVehicleId, vehicleFocusStyle))
}

export function HomeDemoMapbox({
  activeStep,
  popupTitle,
  popupDetail,
  geometry,
  userLngLat,
  adminMapVehicleId = null,
  onAdminAppendWaypoint,
  onAdminRemoveWaypoint,
  vehiclesToUserRoute = null,
  focusedVehicleId = null,
  vehicleFocusStyle = "browse",
  className,
}: HomeDemoMapboxProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const designatedMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const vehiclePopupRef = useRef<mapboxgl.Popup | null>(null)
  const requestPopupRef = useRef<mapboxgl.Popup | null>(null)
  /** Current “active” stop index per vehicle (cycles on positionRefreshMs) */
  const activeStopIndexRef = useRef<Record<string, number>>({})
  const focusedVehicleIdRef = useRef<string | null>(null)
  const vehicleFocusStyleRef = useRef<"browse" | "distance">("browse")
  focusedVehicleIdRef.current = focusedVehicleId
  vehicleFocusStyleRef.current = vehicleFocusStyle
  const intervalIdsRef = useRef<number[]>([])
  const adminWaypointMarkersRef = useRef<mapboxgl.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)
  const geometryRef = useRef(geometry)
  geometryRef.current = geometry
  const userLngLatRef = useRef(userLngLat)
  userLngLatRef.current = userLngLat

  const adminPicking = Boolean(adminMapVehicleId && onAdminAppendWaypoint && onAdminRemoveWaypoint)
  const demoVehiclesActive =
    (activeStep === "vehicles" || activeStep === "popup") && !adminMapVehicleId

  useEffect(() => {
    if (!TOKEN || !wrapRef.current) return
    mapboxgl.accessToken = TOKEN
    const g0 = geometryRef.current
    const map = new mapboxgl.Map({
      container: wrapRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: g0.designated,
      zoom: 14.5,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right")

    map.on("load", () => {
      const g = geometryRef.current
      map.addSource(LINES_SOURCE, {
        type: "geojson",
        data: linesFeatureCollection(g),
      })
      map.addLayer({
        id: LINES_LAYER,
        type: "line",
        source: LINES_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["coalesce", ["get", "trackColor"], "#34d399"],
          "line-width": 4,
          "line-opacity": 0.88,
        },
      })
      map.addSource(STOPS_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addLayer({
        id: STOPS_LAYER,
        type: "circle",
        source: STOPS_SOURCE,
        paint: {
          "circle-pitch-alignment": "map",
          "circle-pitch-scale": "map",
          "circle-radius": [
            "match",
            ["get", "kind"],
            "inactive",
            4,
            "active",
            5,
            "focusedBrowse",
            5,
            "focusedDistance",
            5,
            4,
          ],
          "circle-color": "#ffffff",
          "circle-opacity": 1,
          "circle-stroke-width": [
            "match",
            ["get", "kind"],
            "inactive",
            1,
            "active",
            2,
            "focusedBrowse",
            2,
            "focusedDistance",
            2,
            1,
          ],
          "circle-stroke-color": [
            "match",
            ["get", "kind"],
            "inactive",
            "rgba(0,0,0,0.42)",
            "active",
            "rgba(0,0,0,0.55)",
            "focusedBrowse",
            "#0ea5e9",
            "focusedDistance",
            "#e11d48",
            "rgba(0,0,0,0.42)",
          ],
        },
      })
      map.addSource(DIRECTIONS_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addLayer({
        id: DIRECTIONS_LAYER,
        type: "line",
        source: DIRECTIONS_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#fb7185",
          "line-width": 5,
          "line-opacity": 0.92,
        },
      })
      requestAnimationFrame(() => map.resize())
      setMapReady(true)
    })

    mapRef.current = map
    return () => {
      setMapReady(false)
      clearVehicleSimulation()
      clearAdminWaypoints()
      requestPopupRef.current?.remove()
      requestPopupRef.current = null
      vehiclePopupRef.current?.remove()
      vehiclePopupRef.current = null
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      designatedMarkerRef.current?.remove()
      designatedMarkerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  function clearVehicleSimulation() {
    intervalIdsRef.current.forEach((id) => clearInterval(id))
    intervalIdsRef.current = []
    activeStopIndexRef.current = {}
    vehiclePopupRef.current?.remove()
    vehiclePopupRef.current = null
    const map = mapRef.current
    if (map) {
      const src = map.getSource(STOPS_SOURCE) as mapboxgl.GeoJSONSource | undefined
      if (src) {
        src.setData({ type: "FeatureCollection", features: [] })
      }
    }
  }

  function clearAdminWaypoints() {
    adminWaypointMarkersRef.current.forEach((m) => m.remove())
    adminWaypointMarkersRef.current = []
  }

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    const src = map.getSource(LINES_SOURCE) as mapboxgl.GeoJSONSource | undefined
    if (src) {
      src.setData(linesFeatureCollection(geometry))
    }
    const hideLines = activeStep === "location" && !adminMapVehicleId
    try {
      map.setPaintProperty(LINES_LAYER, "line-opacity", hideLines ? 0 : 0.88)
    } catch {
      /* layer may not exist yet */
    }
  }, [mapReady, geometry, activeStep, adminMapVehicleId])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    const src = map.getSource(DIRECTIONS_SOURCE) as mapboxgl.GeoJSONSource | undefined
    if (!src) return
    const showRoute =
      (activeStep === "vehicles" || activeStep === "popup") && vehiclesToUserRoute?.geometry?.coordinates?.length
    if (!showRoute) {
      src.setData({ type: "FeatureCollection", features: [] })
      return
    }
    src.setData({
      type: "Feature",
      properties: {},
      geometry: vehiclesToUserRoute.geometry,
    })
  }, [mapReady, activeStep, vehiclesToUserRoute])

  /** Step 2: frame the driving route + user when directions load (roads, not straight line). */
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || adminMapVehicleId) return
    if (activeStep !== "vehicles") return
    if (!vehiclesToUserRoute?.geometry?.coordinates?.length || !userLngLat) return
    const bounds = new mapboxgl.LngLatBounds()
    for (const c of vehiclesToUserRoute.geometry.coordinates) {
      bounds.extend(c as [number, number])
    }
    bounds.extend(userLngLat)
    map.fitBounds(bounds, { padding: 88, duration: 1000, maxZoom: 15 })
  }, [mapReady, activeStep, vehiclesToUserRoute, userLngLat, adminMapVehicleId])

  const hadDrivingRouteRef = useRef(false)
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || adminMapVehicleId) return
    if (activeStep !== "vehicles") {
      hadDrivingRouteRef.current = Boolean(vehiclesToUserRoute?.geometry?.coordinates?.length)
      return
    }
    const hasRoute = Boolean(vehiclesToUserRoute?.geometry?.coordinates?.length)
    if (hadDrivingRouteRef.current && !hasRoute) {
      const bounds = new mapboxgl.LngLatBounds()
      allCoordsForBounds(geometry).forEach((c) => bounds.extend(c))
      map.fitBounds(bounds, { padding: 72, duration: 1000, maxZoom: 15 })
    }
    hadDrivingRouteRef.current = hasRoute
  }, [mapReady, activeStep, vehiclesToUserRoute, geometry, adminMapVehicleId])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    try {
      if (!adminMapVehicleId) {
        map.setPaintProperty(LINES_LAYER, "line-width", 4)
      } else {
        map.setPaintProperty(LINES_LAYER, "line-width", [
          "case",
          ["==", ["get", "id"], adminMapVehicleId],
          7,
          4,
        ])
      }
    } catch {
      /* */
    }
  }, [mapReady, adminMapVehicleId, geometry])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    clearVehicleSimulation()
    userMarkerRef.current?.remove()
    userMarkerRef.current = null
    designatedMarkerRef.current?.remove()
    designatedMarkerRef.current = null
    requestPopupRef.current?.remove()
    requestPopupRef.current = null

    const { designated: d } = geometry

    if (
      userLngLat &&
      (activeStep === "location" || activeStep === "vehicles" || activeStep === "popup")
    ) {
      const uEl = document.createElement("div")
      uEl.className =
        "h-4 w-4 rounded-full border-2 border-violet-300 bg-violet-500 shadow-lg ring-4 ring-violet-400/35"
      userMarkerRef.current = new mapboxgl.Marker({
        element: uEl,
        anchor: "center",
        pitchAlignment: "map",
        rotationAlignment: "map",
      })
        .setLngLat(new mapboxgl.LngLat(userLngLat[0], userLngLat[1]))
        .addTo(map)
    }

    if (activeStep === "vehicles" || activeStep === "popup") {
      const dEl = document.createElement("div")
      dEl.className = "h-3.5 w-3.5 rounded-full border-2 border-sky-200/80 bg-sky-400 shadow-md"
      designatedMarkerRef.current = new mapboxgl.Marker({
        element: dEl,
        anchor: "center",
        pitchAlignment: "map",
        rotationAlignment: "map",
      })
        .setLngLat(new mapboxgl.LngLat(d[0], d[1]))
        .addTo(map)
    }

    if (demoVehiclesActive) {
      geometry.vehicles.forEach((v) => {
        activeStopIndexRef.current[v.id] = 0
      })
      syncVehicleStopsData(map, geometry, activeStopIndexRef.current, focusedVehicleId, vehicleFocusStyle)
      geometry.vehicles.forEach((v) => {
        const n = v.positions.length
        if (n < 2) return
        const vid = v.id
        const intervalId = window.setInterval(() => {
          const cur = activeStopIndexRef.current[vid] ?? 0
          activeStopIndexRef.current[vid] = (cur + 1) % n
          const m = mapRef.current
          if (m) {
            syncVehicleStopsData(
              m,
              geometryRef.current,
              activeStopIndexRef.current,
              focusedVehicleIdRef.current,
              vehicleFocusStyleRef.current,
            )
          }
        }, Math.max(200, v.positionRefreshMs))
        intervalIdsRef.current.push(intervalId)
      })
    }

    if (activeStep === "popup") {
      requestPopupRef.current = new mapboxgl.Popup({
        closeOnClick: false,
        closeButton: false,
        offset: 14,
        maxWidth: "280px",
        className: "home-demo-mapbox-popup home-demo-mapbox-popup--no-close",
      })
        .setLngLat(d)
        .setHTML(
          `<div style="padding:10px 12px;font-family:ui-sans-serif,system-ui,sans-serif">
            <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#a1a1aa">Request preview</p>
            <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#fafafa">${escapeHtml(popupTitle)}</p>
            <p style="margin:6px 0 0;font-size:12px;line-height:1.45;color:#a1a1aa">${escapeHtml(popupDetail)}</p>
          </div>`,
        )
        .addTo(map)
    }

    /** Localhost admin map picking: do not move camera when geometry updates from new waypoints */
    if (!adminMapVehicleId) {
      if (activeStep === "location") {
        if (userLngLat) {
          map.flyTo({ center: userLngLat, zoom: 15.2, duration: 1200, essential: true })
        } else {
          map.flyTo({ center: d, zoom: 13.2, duration: 900, essential: true })
        }
      } else if (activeStep === "vehicles") {
        const bounds = new mapboxgl.LngLatBounds()
        allCoordsForBounds(geometry).forEach((c) => bounds.extend(c))
        map.fitBounds(bounds, { padding: 72, duration: 1400, maxZoom: 15 })
      } else {
        const bounds = new mapboxgl.LngLatBounds()
        ;[d, ...geometry.vehicles.flatMap((v) => v.positions)].forEach((c) => bounds.extend(c))
        map.fitBounds(bounds, {
          padding: { top: 110, bottom: 88, left: 88, right: 88 },
          duration: 1400,
          maxZoom: 15.2,
        })
      }
    }

    return () => {
      clearVehicleSimulation()
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      designatedMarkerRef.current?.remove()
      designatedMarkerRef.current = null
      requestPopupRef.current?.remove()
      requestPopupRef.current = null
    }
  }, [mapReady, activeStep, popupTitle, popupDetail, userLngLat, geometry, demoVehiclesActive, adminMapVehicleId])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !demoVehiclesActive) return
    syncVehicleStopsData(
      map,
      geometryRef.current,
      activeStopIndexRef.current,
      focusedVehicleId,
      vehicleFocusStyle,
    )
  }, [mapReady, demoVehiclesActive, focusedVehicleId, vehicleFocusStyle])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    const onStopClick = (e: mapboxgl.MapLayerMouseEvent) => {
      const f = e.features?.[0]
      if (!f?.properties || f.geometry?.type !== "Point") return
      const coords = f.geometry.coordinates as [number, number]
      const fromLng = coords[0]
      const fromLat = coords[1]
      const p = f.properties as {
        name?: unknown
        stopCount?: unknown
        refreshMs?: unknown
        stopIndex?: unknown
      }
      const name = String(p.name ?? "Unit")
      const stopCount = Math.max(1, Number(p.stopCount) || 1)
      const refreshMs = Number(p.refreshMs) || 0
      const stopIdx = Number(p.stopIndex)
      const stopIndexOneBased = Number.isFinite(stopIdx) ? stopIdx + 1 : 1

      vehiclePopupRef.current?.remove()
      const popup = new mapboxgl.Popup({
        closeOnClick: true,
        closeButton: true,
        offset: 12,
        maxWidth: "280px",
        className: "home-demo-mapbox-popup",
      })
        .setLngLat(e.lngLat)
        .setHTML(buildStopPopupInitialHtml(name, stopIndexOneBased, stopCount, refreshMs))
        .addTo(map)
      vehiclePopupRef.current = popup

      popup.once("open", () => {
        const root = popup.getElement()
        const btn = root?.querySelector("[data-demo-request-service]") as HTMLButtonElement | null
        if (!btn) return
        btn.addEventListener("click", async () => {
          if (!TOKEN) {
            popup.setHTML(buildStopPopupNoTokenHtml())
            return
          }
          const user = userLngLatRef.current
          if (!user) {
            popup.setHTML(buildStopPopupNoUserHtml(name))
            return
          }
          btn.disabled = true
          const prev = btn.textContent
          btn.textContent = "Getting route…"
          const route = await fetchDrivingRoute([fromLng, fromLat], user, TOKEN)
          btn.disabled = false
          btn.textContent = prev ?? "Request service"
          if (!route) {
            popup.setHTML(buildStopPopupRouteErrorHtml())
            return
          }
          const { timeStr, distStr } = formatDriveEta(route.durationSec, route.distanceM)
          popup.setHTML(buildStopPopupEtaHtml(name, timeStr, distStr))
        })
      })
    }

    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer"
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ""
    }

    map.on("click", STOPS_LAYER, onStopClick)
    map.on("mouseenter", STOPS_LAYER, onEnter)
    map.on("mouseleave", STOPS_LAYER, onLeave)

    return () => {
      map.off("click", STOPS_LAYER, onStopClick)
      map.off("mouseenter", STOPS_LAYER, onEnter)
      map.off("mouseleave", STOPS_LAYER, onLeave)
    }
  }, [mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !adminPicking || !adminMapVehicleId) {
      clearAdminWaypoints()
      return
    }

    const vehicle = geometry.vehicles.find((v) => v.id === adminMapVehicleId)
    if (!vehicle) {
      clearAdminWaypoints()
      return
    }

    function handleMapClickForAdmin(e: mapboxgl.MapMouseEvent) {
      onAdminAppendWaypoint?.(e.lngLat.lng, e.lngLat.lat)
    }

    clearAdminWaypoints()
    vehicle.positions.forEach((pos, index) => {
      const el = document.createElement("button")
      el.type = "button"
      el.className =
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-amber-300 bg-amber-950/95 text-[11px] font-bold text-amber-100 shadow-lg ring-2 ring-amber-500/40 hover:bg-amber-900"
      el.textContent = String(index + 1)
      el.title = `Waypoint ${index + 1} — click to remove`
      el.addEventListener("click", (ev) => {
        ev.stopPropagation()
        onAdminRemoveWaypoint?.(index)
      })
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
        pitchAlignment: "map",
        rotationAlignment: "map",
      })
        .setLngLat(new mapboxgl.LngLat(pos[0], pos[1]))
        .addTo(map)
      adminWaypointMarkersRef.current.push(marker)
    })

    map.on("click", handleMapClickForAdmin)

    return () => {
      map.off("click", handleMapClickForAdmin)
      clearAdminWaypoints()
    }
  }, [mapReady, adminPicking, adminMapVehicleId, geometry, onAdminAppendWaypoint, onAdminRemoveWaypoint])

  if (!TOKEN) {
    return (
      <div
        className={`flex h-[1000px] w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-center text-sm text-zinc-400 ${className ?? ""}`}
      >
        Add <code className="text-zinc-200">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to show the live demo map.
      </div>
    )
  }

  return (
    <div
      className={`home-demo-mapbox-wrap relative ${adminMapVehicleId ? "home-demo-mapbox--admin-pick" : ""} ${className ?? ""}`}
    >
      <div
        ref={wrapRef}
        className="h-[1000px] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
      />
    </div>
  )
}

function linesFeatureCollection(g: DemoGeometry) {
  return {
    type: "FeatureCollection" as const,
    features: g.vehicles.map((v) => ({
      type: "Feature" as const,
      properties: {
        id: v.id,
        name: v.name,
        trackColor: v.trackColor ?? "#34d399",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: v.positions,
      },
    })),
  }
}
