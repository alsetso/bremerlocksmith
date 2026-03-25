"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import type { TransitStopMapPoint } from "@/lib/nextrip"

interface MapComponentProps {
  /** Map center + primary user pin (lat, lng); use a sensible default while the location modal is open */
  mapCenter: [number, number]
  /** Single `route_id` or comma-separated IDs; when null/undefined, the vehicles API default (or env) applies */
  vehicleRouteIds?: string | null
  /** Ordered stop coordinates for polyline + markers; null clears the overlay */
  transitStopPath?: TransitStopMapPoint[] | null
  /** When false, buses and route/stop overlays are cleared and not polled */
  transitMapVisible?: boolean
  /** When true, hide the blue “your location” pin, show `pickerPin`, and forward background clicks (not transit stops) */
  locationPickerActive?: boolean
  /** Picked coordinates while the location modal is open; purple marker */
  pickerPin?: [number, number] | null
  /** After user confirms a map tap in picker mode (see amber confirm popup). */
  onLocationPick?: (lat: number, lng: number) => void
  /** After user confirms a map tap in the popup (non–picker mode). */
  onPrimaryLocationFromMap?: (lat: number, lng: number) => void
  /** User confirmed a typed / searched address — blue pin + popup show this label (popup opens). */
  selectedLocationLabel?: string | null
  /** Show Mapbox geolocate (target) + “Find me” top-left whenever the map is in view (not tied to live mode). */
  showFindMeControl?: boolean
  /** Increment to programmatically trigger Find me (e.g. after “Use current location” in the panel). */
  findMeTriggerNonce?: number
  /** Browser returned a GPS fix — parent should set live location from device. */
  onGeolocateSuccess?: (coords: [number, number]) => void
  /** GPS denied / failed — parent should pin service location to map center (“dropped pin”). */
  onGeolocateFallback?: (coords: [number, number]) => void
  /**
   * When true, hide the static blue service pin and rely on Mapbox GeolocateControl for the
   * live dot, accuracy ring, and heading — avoids duplicating the user location on the map.
   */
  liveGpsPrimary?: boolean
  /** Green pin: device position while meeting point is fixed (independent live tracking). */
  trackedDevicePin?: [number, number] | null
}

function escapePopupText(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

const METRO_POLL_MS = 10_000

interface MetroVehicle {
  id?: string
  trip_id?: string
  route_id?: string
  direction?: string
  latitude?: number
  longitude?: number
  bearing?: number
  speed?: number
}

function isValidVehiclePosition(lat: number, lng: number) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat !== 0 &&
    lng !== 0
  )
}

const USER_VIEW_ZOOM = 13
/** Zoom when user taps the map to drop / confirm a meeting pin. */
const LOCATION_PICK_ZOOM = 18
const FLY_TO_USER_DURATION_SEC = 1.05
const TRANSIT_LINE_SOURCE = "transit-line"
const TRANSIT_STOPS_SOURCE = "transit-stops"
const TRANSIT_LINE_LAYER = "transit-line-layer"
const TRANSIT_STOPS_LAYER = "transit-stops-layer"

export function MapComponent({
  mapCenter,
  vehicleRouteIds,
  transitStopPath,
  transitMapVisible = true,
  locationPickerActive = false,
  pickerPin = null,
  onLocationPick,
  onPrimaryLocationFromMap,
  selectedLocationLabel = null,
  showFindMeControl = false,
  findMeTriggerNonce = 0,
  onGeolocateSuccess,
  onGeolocateFallback,
  liveGpsPrimary = false,
  trackedDevicePin = null,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const mapCenterRef = useRef(mapCenter)
  mapCenterRef.current = mapCenter
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const pickerMarkerRef = useRef<mapboxgl.Marker | null>(null)
  /** Amber “proposed” pin until the user confirms or cancels in the popup. */
  const pendingConfirmMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const locationPickerActiveRef = useRef(locationPickerActive)
  locationPickerActiveRef.current = locationPickerActive
  const onLocationPickRef = useRef(onLocationPick)
  onLocationPickRef.current = onLocationPick
  const onPrimaryLocationFromMapRef = useRef(onPrimaryLocationFromMap)
  onPrimaryLocationFromMapRef.current = onPrimaryLocationFromMap
  const vehicleRouteIdsRef = useRef<string | null | undefined>(vehicleRouteIds)
  vehicleRouteIdsRef.current = vehicleRouteIds
  const transitStopPathRef = useRef<TransitStopMapPoint[] | null | undefined>(undefined)
  transitStopPathRef.current = transitStopPath ?? null
  const transitMapVisibleRef = useRef(transitMapVisible)
  transitMapVisibleRef.current = transitMapVisible
  const pickerPinRef = useRef(pickerPin)
  pickerPinRef.current = pickerPin
  const selectedLocationLabelRef = useRef<string | null | undefined>(selectedLocationLabel)
  selectedLocationLabelRef.current = selectedLocationLabel
  const showFindMeControlRef = useRef(showFindMeControl)
  showFindMeControlRef.current = showFindMeControl
  const onGeolocateSuccessRef = useRef(onGeolocateSuccess)
  onGeolocateSuccessRef.current = onGeolocateSuccess
  const onGeolocateFallbackRef = useRef(onGeolocateFallback)
  onGeolocateFallbackRef.current = onGeolocateFallback
  const liveGpsPrimaryRef = useRef(liveGpsPrimary)
  liveGpsPrimaryRef.current = liveGpsPrimary
  const trackedDevicePinRef = useRef(trackedDevicePin)
  trackedDevicePinRef.current = trackedDevicePin
  const deviceMarkerRef = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    ;(mapInstanceRef.current as any)?._refreshTransitOverlay?.()
  }, [transitStopPath])

  useEffect(() => {
    transitMapVisibleRef.current = transitMapVisible
    ;(mapInstanceRef.current as any)?._refreshTransitOverlay?.()
    ;(mapInstanceRef.current as any)?._updateMetroVehicles?.()
    ;(mapInstanceRef.current as any)?._refitMainBounds?.()
  }, [transitMapVisible])

  useEffect(() => {
    pendingConfirmMarkerRef.current?.remove()
    pendingConfirmMarkerRef.current = null
  }, [mapCenter, locationPickerActive, pickerPin])

  useEffect(() => {
    ;(mapInstanceRef.current as any)?._syncUserPins?.()
    void (mapInstanceRef.current as any)?._updateMetroVehicles?.()
  }, [mapCenter, locationPickerActive, pickerPin, selectedLocationLabel, liveGpsPrimary, trackedDevicePin])

  /** Live GPS became primary after map existed — drop static pin and start geolocate + fly. */
  useEffect(() => {
    const map = mapInstanceRef.current as {
      _syncUserPins?: () => void
      _triggerFindMe?: () => void
      _pendingFlyToLive?: boolean
    } | null
    if (!map?._syncUserPins) return
    map._syncUserPins()
    if (!liveGpsPrimary) return
    map._pendingFlyToLive = true
    map._triggerFindMe?.()
  }, [liveGpsPrimary])

  useEffect(() => {
    ;(mapInstanceRef.current as any)?._syncFindMeControl?.()
  }, [showFindMeControl, locationPickerActive])

  useEffect(() => {
    if (findMeTriggerNonce <= 0) return
    const trigger = (mapInstanceRef.current as { _triggerFindMe?: () => void } | null)?._triggerFindMe
    void trigger?.()
  }, [findMeTriggerNonce])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!mapboxToken) return

    let findMeControlInstance: mapboxgl.IControl | null = null
    let geolocateForFindMe: mapboxgl.GeolocateControl | null = null

    mapboxgl.accessToken = mapboxToken
    const [initialLat, initialLng] = mapCenterRef.current
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialLng, initialLat],
      zoom: USER_VIEW_ZOOM,
      pitchWithRotate: false,
      dragRotate: false,
      attributionControl: true,
    })

    const vehicleMarkers = new Map<string, mapboxgl.Marker>()

    const flyToUserView = (animated: boolean) => {
      if (locationPickerActiveRef.current) {
        const pin = pickerPinRef.current
        if (pin && pin.length >= 2) {
          const [pLat, pLng] = pin
          map.flyTo({
            center: [pLng, pLat],
            zoom: LOCATION_PICK_ZOOM,
            duration: animated ? FLY_TO_USER_DURATION_SEC * 1000 : 0,
          })
          return
        }
      }
      const [lat, lng] = mapCenterRef.current
      if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) return
      const zoom = liveGpsPrimaryRef.current ? LOCATION_PICK_ZOOM : USER_VIEW_ZOOM
      map.flyTo({
        center: [lng, lat],
        zoom,
        duration: animated ? FLY_TO_USER_DURATION_SEC * 1000 : 0,
      })
    }

    const buildServiceLocationPopupHtml = (selectedLabel: string | null) => {
      if (selectedLabel?.trim()) {
        const label = escapePopupText(selectedLabel.trim())
        return `
          <div style="color:#111;font-weight:600;text-align:left;padding:10px 12px;max-width:min(280px,72vw);">
            <div style="color:#2563eb;font-size:13px;margin-bottom:6px;font-weight:700;">Selected location</div>
            <div style="font-size:12px;color:#333;line-height:1.45;">${label}</div>
          </div>
        `
      }
      return `
        <div style="color:#111;font-weight:600;text-align:center;padding:10px 12px;">
          <div style="color:#2563eb;font-size:13px;margin-bottom:4px;">Your location</div>
          <div style="font-size:12px;color:#666;">Live GPS · technician meets you here</div>
        </div>
      `
    }

    const syncUserPins = () => {
      if (!map.isStyleLoaded()) return
      const pickerActive = locationPickerActiveRef.current
      const [cLat, cLng] = mapCenterRef.current
      const pin = pickerPinRef.current
      const selectedLabel = selectedLocationLabelRef.current?.trim() ? selectedLocationLabelRef.current!.trim() : null

      if (pickerActive) {
        deviceMarkerRef.current?.remove()
        deviceMarkerRef.current = null
        if (userMarkerRef.current) {
          userMarkerRef.current.remove()
          userMarkerRef.current = null
        }
        if (pin && pin.length >= 2) {
          const [pLat, pLng] = pin
          if (!pickerMarkerRef.current) {
            pickerMarkerRef.current = new mapboxgl.Marker({ color: "#c084fc" })
              .setLngLat([pLng, pLat])
              .setPopup(
                new mapboxgl.Popup({ offset: 18 }).setHTML(`
                  <div style="color: black; font-weight: 600; text-align: center; padding: 8px;">
                    <div style="color: #7c3aed; font-size: 14px; margin-bottom: 4px;">📍 Picked location</div>
                    <div style="font-size: 12px; color: #666;">Confirm in the panel below</div>
                  </div>
                `),
              )
              .addTo(map)
          } else {
            pickerMarkerRef.current.setLngLat([pLng, pLat])
          }
        } else {
          pickerMarkerRef.current?.remove()
          pickerMarkerRef.current = null
        }
        return
      }

      pickerMarkerRef.current?.remove()
      pickerMarkerRef.current = null

      if (liveGpsPrimaryRef.current) {
        deviceMarkerRef.current?.remove()
        deviceMarkerRef.current = null
        userMarkerRef.current?.remove()
        userMarkerRef.current = null
        return
      }

      const html = buildServiceLocationPopupHtml(selectedLabel)

      if (!userMarkerRef.current) {
        const popup = new mapboxgl.Popup({ offset: 20, closeButton: true }).setHTML(html)
        userMarkerRef.current = new mapboxgl.Marker({ color: "#2563eb" })
          .setLngLat([cLng, cLat])
          .setPopup(popup)
          .addTo(map)
        if (selectedLabel) {
          userMarkerRef.current.togglePopup()
        }
      } else {
        userMarkerRef.current.setLngLat([cLng, cLat])
        const marker = userMarkerRef.current
        const popup = marker.getPopup()
        if (popup) {
          const wasOpen = popup.isOpen()
          popup.setHTML(html)
          if (selectedLabel) {
            if (!wasOpen) marker.togglePopup()
          } else if (wasOpen) {
            marker.togglePopup()
          }
        }
      }

      const trackPin = trackedDevicePinRef.current
      if (trackPin && trackPin.length >= 2) {
        const [dLat, dLng] = trackPin
        if (!deviceMarkerRef.current) {
          deviceMarkerRef.current = new mapboxgl.Marker({ color: "#22c55e" })
            .setLngLat([dLng, dLat])
            .setPopup(
              new mapboxgl.Popup({ offset: 14 }).setHTML(`
          <div style="color:#111;font-weight:600;text-align:left;padding:8px 10px;max-width:220px;">
            <div style="color:#16a34a;font-size:12px;margin-bottom:4px;font-weight:700;">You · live</div>
            <div style="font-size:11px;color:#444;line-height:1.4;">Updates as you move. Meeting pin may differ.</div>
          </div>
        `),
            )
            .addTo(map)
        } else {
          deviceMarkerRef.current.setLngLat([dLng, dLat])
        }
      } else {
        deviceMarkerRef.current?.remove()
        deviceMarkerRef.current = null
      }
    }

    const syncFindMeControl = () => {
      if (!map.isStyleLoaded()) return
      const want =
        Boolean(showFindMeControlRef.current) && typeof navigator !== "undefined" && "geolocation" in navigator

      if (!want) {
        if (findMeControlInstance) {
          map.removeControl(findMeControlInstance)
          findMeControlInstance = null
          geolocateForFindMe = null
        }
        ;(map as { _triggerFindMe?: () => void })._triggerFindMe = () => {}
        return
      }

      /** Must stay synchronous after a user gesture so the browser can show the location prompt. */
      const runSmartFindMe = () => {
        ;(map as { _pendingFlyToLive?: boolean })._pendingFlyToLive = true
        void geolocateForFindMe?.trigger()
      }

      if (findMeControlInstance) {
        ;(map as { _triggerFindMe?: () => void })._triggerFindMe = runSmartFindMe
        return
      }

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        trackUserLocation: true,
        showUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true,
      })
      geolocateForFindMe = geolocate

      const findMeControl: mapboxgl.IControl = {
        onAdd() {
          const root = geolocate.onAdd(map) as HTMLElement
          root.style.display = "flex"
          root.style.alignItems = "center"
          root.style.gap = "6px"
          root.style.padding = "4px 6px"
          root.style.background = "rgba(255,255,255,0.92)"
          root.style.borderRadius = "8px"
          root.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)"
          const stripControlChrome = (el: HTMLElement) => {
            el.style.background = "transparent"
            el.style.boxShadow = "none"
            el.querySelectorAll<HTMLElement>("button, .mapboxgl-ctrl-icon, .mapboxgl-ctrl-icon > *").forEach((node) => {
              node.style.background = "transparent"
              node.style.boxShadow = "none"
            })
          }
          stripControlChrome(root)

          geolocate.on("geolocate", (e: { coords: GeolocationCoordinates }) => {
            onGeolocateSuccessRef.current?.([e.coords.latitude, e.coords.longitude])
            const m = map as { _pendingFlyToLive?: boolean }
            if (m._pendingFlyToLive) {
              m._pendingFlyToLive = false
              map.flyTo({
                center: [e.coords.longitude, e.coords.latitude],
                zoom: LOCATION_PICK_ZOOM,
                duration: Math.round(FLY_TO_USER_DURATION_SEC * 1000),
              })
            }
          })
          geolocate.on("error", () => {
            const c = map.getCenter()
            onGeolocateFallbackRef.current?.([c.lat, c.lng])
          })

          const label = document.createElement("span")
          label.textContent = "Find me"
          label.style.fontSize = "12px"
          label.style.fontWeight = "600"
          label.style.color = "#1f2937"
          label.style.letterSpacing = "0.01em"
          label.style.whiteSpace = "nowrap"
          label.style.userSelect = "none"
          label.style.cursor = "pointer"
          label.addEventListener("click", () => {
            runSmartFindMe()
          })
          root.appendChild(label)

          return root
        },
        onRemove() {
          geolocate.onRemove()
        },
      }

      findMeControlInstance = findMeControl
      map.addControl(findMeControl, "top-left")
      ;(map as { _triggerFindMe?: () => void })._triggerFindMe = runSmartFindMe
    }

    const ensureTransitSources = () => {
      if (!map.getSource(TRANSIT_LINE_SOURCE)) {
        map.addSource(TRANSIT_LINE_SOURCE, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        })
      }
      if (!map.getSource(TRANSIT_STOPS_SOURCE)) {
        map.addSource(TRANSIT_STOPS_SOURCE, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        })
      }
      if (!map.getLayer(TRANSIT_LINE_LAYER)) {
        map.addLayer({
          id: TRANSIT_LINE_LAYER,
          type: "line",
          source: TRANSIT_LINE_SOURCE,
          paint: { "line-color": "#0d9488", "line-width": 4, "line-opacity": 0.9 },
        })
      }
      if (!map.getLayer(TRANSIT_STOPS_LAYER)) {
        map.addLayer({
          id: TRANSIT_STOPS_LAYER,
          type: "circle",
          source: TRANSIT_STOPS_SOURCE,
          paint: {
            "circle-radius": 6,
            "circle-color": "#0f766e",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        })
      }
    }

    const clearVehicleMarkers = () => {
      for (const marker of vehicleMarkers.values()) marker.remove()
      vehicleMarkers.clear()
    }

    const refitMainBounds = () => {
      if (!transitMapVisibleRef.current) {
        flyToUserView(false)
        return
      }
      const stops = transitStopPathRef.current
      const valid = stops?.filter(
        (p) =>
          typeof p.lat === "number" &&
          typeof p.lng === "number" &&
          !Number.isNaN(p.lat) &&
          !Number.isNaN(p.lng),
      )
      if (valid && valid.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        for (const p of valid) bounds.extend([p.lng, p.lat])
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 700 })
          return
        }
      }
      flyToUserView(false)
    }

    const refreshTransitOverlay = () => {
      if (!map.isStyleLoaded()) return
      ensureTransitSources()

      const lineSource = map.getSource(TRANSIT_LINE_SOURCE) as mapboxgl.GeoJSONSource
      const stopsSource = map.getSource(TRANSIT_STOPS_SOURCE) as mapboxgl.GeoJSONSource
      if (!lineSource || !stopsSource) return

      if (!transitMapVisibleRef.current) {
        lineSource.setData({ type: "FeatureCollection", features: [] })
        stopsSource.setData({ type: "FeatureCollection", features: [] })
        refitMainBounds()
        return
      }

      const path = transitStopPathRef.current ?? []
      const valid = path.filter(
        (p) =>
          typeof p.lat === "number" &&
          typeof p.lng === "number" &&
          !Number.isNaN(p.lat) &&
          !Number.isNaN(p.lng),
      )

      const lineFeature =
        valid.length >= 2
          ? [{
              type: "Feature",
              geometry: { type: "LineString", coordinates: valid.map((p) => [p.lng, p.lat]) },
              properties: {},
            }]
          : []

      const stopFeatures = valid.map((p, i) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: { label: `${i + 1}. ${p.label}`, placeCode: p.placeCode },
      }))

      lineSource.setData({ type: "FeatureCollection", features: lineFeature as any })
      stopsSource.setData({ type: "FeatureCollection", features: stopFeatures as any })
      refitMainBounds()
    }

    const vehiclesUrl = () => {
      const fromPanel = vehicleRouteIdsRef.current?.trim()
      if (fromPanel) return `/api/metro-transit/vehicles?${new URLSearchParams({ routes: fromPanel }).toString()}`
      const extra = process.env.NEXT_PUBLIC_METRO_TRANSIT_ROUTES?.trim()
      if (extra) return `/api/metro-transit/vehicles?${new URLSearchParams({ routes: extra }).toString()}`
      return "/api/metro-transit/vehicles"
    }

    const updateMetroVehicles = async () => {
      if (locationPickerActiveRef.current) {
        clearVehicleMarkers()
        return
      }
      if (!transitMapVisibleRef.current) {
        clearVehicleMarkers()
        return
      }
      try {
        const res = await fetch(vehiclesUrl())
        if (!res.ok) return
        const vehicles: MetroVehicle[] = await res.json()
        clearVehicleMarkers()
        for (const v of vehicles) {
          const lat = v.latitude
          const lng = v.longitude
          if (typeof lat !== "number" || typeof lng !== "number") continue
          if (!isValidVehiclePosition(lat, lng)) continue
          const bearing = typeof v.bearing === "number" ? v.bearing : 0

          const el = document.createElement("div")
          el.style.width = "28px"
          el.style.height = "28px"
          el.style.borderRadius = "50%"
          el.style.background = "#0f766e"
          el.style.border = "2px solid #fff"
          el.style.boxShadow = "0 1px 2px rgba(0,0,0,0.35)"
          el.style.transform = `rotate(${bearing}deg)`

          const key = `${v.id ?? v.trip_id ?? "v"}-${lat.toFixed(5)}-${lng.toFixed(5)}`
          const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 18 }).setHTML(`
                <div style="color: #111; min-width: 140px; padding: 4px 2px;">
                  <div style="font-weight: 700; color: #0f766e; font-size: 14px;">Route ${v.route_id ?? "?"}</div>
                  <div style="font-size: 12px; color: #444; margin-top: 4px;">${v.direction ?? ""}${v.direction ? " · " : ""}${typeof v.speed === "number" && v.speed > 0 ? `${Math.round(v.speed)} mph` : "—"}</div>
                  <div style="font-size: 11px; color: #666; margin-top: 6px;">Metro Transit (live)</div>
                </div>
              `),
            )
            .addTo(map)
          vehicleMarkers.set(key, marker)
        }
      } catch {
        /* ignore transient network errors */
      }
    }

    const clearPendingConfirm = () => {
      const m = pendingConfirmMarkerRef.current
      pendingConfirmMarkerRef.current = null
      m?.remove()
    }

    /** Any map tap (picker or main): amber pin + popup; parent state updates only after Confirm. */
    const openPendingConfirmPopup = (lat: number, lng: number) => {
      clearPendingConfirm()

      map.flyTo({
        center: [lng, lat],
        zoom: LOCATION_PICK_ZOOM,
        duration: Math.round(FLY_TO_USER_DURATION_SEC * 1000),
      })

      const root = document.createElement("div")
      root.style.cssText =
        "padding:14px 16px;min-width:200px;max-width:min(260px,88vw);background:#18181b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;"

      const title = document.createElement("p")
      title.textContent = "Use this location?"
      title.style.cssText =
        "margin:0 0 14px;font-size:15px;font-weight:600;line-height:1.25;letter-spacing:-0.02em;color:#fafafa;"

      const row = document.createElement("div")
      row.style.cssText = "display:flex;gap:8px;align-items:stretch;"

      const btnConfirm = document.createElement("button")
      btnConfirm.type = "button"
      btnConfirm.textContent = "Use location"
      btnConfirm.setAttribute("aria-label", "Confirm meeting location at map pin")
      btnConfirm.style.cssText =
        "flex:1;min-width:0;padding:10px 12px;border-radius:10px;border:none;background:#3b82f6;color:#fff;font-weight:600;font-size:13px;cursor:pointer;line-height:1.2;"

      const btnCancel = document.createElement("button")
      btnCancel.type = "button"
      btnCancel.textContent = "Cancel"
      btnCancel.setAttribute("aria-label", "Dismiss and remove pin")
      btnCancel.style.cssText =
        "padding:10px 12px;border-radius:10px;border:1px solid #3f3f46;background:#27272a;color:#e4e4e7;font-weight:500;font-size:13px;cursor:pointer;line-height:1.2;white-space:nowrap;"

      const commit = () => {
        clearPendingConfirm()
        if (locationPickerActiveRef.current) {
          onLocationPickRef.current?.(lat, lng)
        } else {
          onPrimaryLocationFromMapRef.current?.(lat, lng)
        }
      }

      btnConfirm.addEventListener("click", (e) => {
        e.stopPropagation()
        commit()
      })
      btnCancel.addEventListener("click", (e) => {
        e.stopPropagation()
        clearPendingConfirm()
      })

      row.appendChild(btnConfirm)
      row.appendChild(btnCancel)
      root.appendChild(title)
      root.appendChild(row)

      const popup = new mapboxgl.Popup({
        offset: 18,
        closeButton: false,
        maxWidth: "280px",
        className: "bremer-map-location-popup",
      }).setDOMContent(root)

      const marker = new mapboxgl.Marker({ color: "#f59e0b" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map)

      pendingConfirmMarkerRef.current = marker
      marker.togglePopup()

      popup.on("close", () => {
        if (pendingConfirmMarkerRef.current !== marker) return
        pendingConfirmMarkerRef.current = null
        marker.remove()
      })
    }

    const onMapPickClick = (e: mapboxgl.MapMouseEvent) => {
      if (map.getLayer(TRANSIT_STOPS_LAYER)) {
        try {
          const stops = map.queryRenderedFeatures(e.point, { layers: [TRANSIT_STOPS_LAYER] })
          if (stops.length > 0) return
        } catch {
          /* ignore */
        }
      }
      const { lat, lng } = e.lngLat
      openPendingConfirmPopup(lat, lng)
    }

    let stopClickBound = false
    let mapPickClickBound = false
    const onStopClick = (e: mapboxgl.MapLayerMouseEvent) => {
      const props = e.features?.[0]?.properties as { label?: string; placeCode?: string } | undefined
      if (!props) return
      new mapboxgl.Popup({ closeButton: true })
        .setLngLat(e.lngLat)
        .setHTML(
          `<div style="font-size:12px;padding:4px 2px;color:#111;"><strong>${escapePopupText(props.label ?? "")}</strong><div style="color:#666;font-size:11px;margin-top:4px;">${escapePopupText(props.placeCode ?? "")}</div></div>`,
        )
        .addTo(map)
    }

    map.on("load", () => {
      ensureTransitSources()
      syncUserPins()
      syncFindMeControl()
      ;(map as any)._syncUserPins = syncUserPins
      ;(map as any)._syncFindMeControl = syncFindMeControl
      setTimeout(() => {
        if (!liveGpsPrimaryRef.current) flyToUserView(true)
      }, 40)
      if (
        liveGpsPrimaryRef.current &&
        geolocateForFindMe &&
        typeof navigator !== "undefined" &&
        "geolocation" in navigator
      ) {
        ;(map as { _pendingFlyToLive?: boolean })._pendingFlyToLive = true
        void geolocateForFindMe.trigger()
      }
      refreshTransitOverlay()
      void updateMetroVehicles()
      map.on("click", TRANSIT_STOPS_LAYER, onStopClick)
      map.on("mouseenter", TRANSIT_STOPS_LAYER, () => (map.getCanvas().style.cursor = "pointer"))
      map.on("mouseleave", TRANSIT_STOPS_LAYER, () => (map.getCanvas().style.cursor = ""))
      stopClickBound = true
      map.on("click", onMapPickClick)
      mapPickClickBound = true
    })

    const metroInterval = setInterval(() => void updateMetroVehicles(), METRO_POLL_MS)
    mapInstanceRef.current = map
    ;(mapInstanceRef.current as any)._refreshTransitOverlay = refreshTransitOverlay
    ;(mapInstanceRef.current as any)._refitMainBounds = refitMainBounds
    ;(mapInstanceRef.current as any)._updateMetroVehicles = updateMetroVehicles
    ;(mapInstanceRef.current as any)._syncUserPins = syncUserPins
    ;(mapInstanceRef.current as any)._syncFindMeControl = syncFindMeControl
    ;(mapInstanceRef.current as any)._cleanup = () => {
      ;(map as { _pendingFlyToLive?: boolean })._pendingFlyToLive = false
      pendingConfirmMarkerRef.current?.remove()
      pendingConfirmMarkerRef.current = null
      deviceMarkerRef.current?.remove()
      deviceMarkerRef.current = null
      clearInterval(metroInterval)
      clearVehicleMarkers()
      if (findMeControlInstance) {
        try {
          map.removeControl(findMeControlInstance)
        } catch {
          /* ignore */
        }
        findMeControlInstance = null
        geolocateForFindMe = null
      }
      if (stopClickBound) {
        map.off("click", TRANSIT_STOPS_LAYER, onStopClick)
      }
      if (mapPickClickBound) {
        map.off("click", onMapPickClick)
      }
    }

    return () => {
      pendingConfirmMarkerRef.current?.remove()
      pendingConfirmMarkerRef.current = null
      deviceMarkerRef.current?.remove()
      deviceMarkerRef.current = null
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      pickerMarkerRef.current?.remove()
      pickerMarkerRef.current = null
      if (mapInstanceRef.current) {
        if ((mapInstanceRef.current as any)._cleanup) {
          ;(mapInstanceRef.current as any)._cleanup()
        }
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full animate-fade-in overflow-hidden bg-background" />
    </div>
  )
}
