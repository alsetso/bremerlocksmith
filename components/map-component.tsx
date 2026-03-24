"use client"

import { useEffect, useRef } from "react"
import type { TransitStopMapPoint } from "@/lib/nextrip"

interface MapComponentProps {
  userLocation: [number, number]
  /** Single `route_id` or comma-separated IDs; when null/undefined, the vehicles API default (or env) applies */
  vehicleRouteIds?: string | null
  /** Ordered stop coordinates for polyline + markers; null clears the overlay */
  transitStopPath?: TransitStopMapPoint[] | null
  /** When false, buses and route/stop overlays are cleared and not polled */
  transitMapVisible?: boolean
}

function escapePopupText(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

const METRO_POLL_MS = 10_000

interface MetroVehicle {
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
const FLY_TO_USER_DURATION_SEC = 1.05

export function MapComponent({
  userLocation,
  vehicleRouteIds,
  transitStopPath,
  transitMapVisible = true,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const userLocationRef = useRef(userLocation)
  userLocationRef.current = userLocation
  const vehicleRouteIdsRef = useRef<string | null | undefined>(vehicleRouteIds)
  vehicleRouteIdsRef.current = vehicleRouteIds
  const transitStopPathRef = useRef<TransitStopMapPoint[] | null | undefined>(undefined)
  transitStopPathRef.current = transitStopPath ?? null
  const transitMapVisibleRef = useRef(transitMapVisible)
  transitMapVisibleRef.current = transitMapVisible

  useEffect(() => {
    mapInstanceRef.current?._refreshTransitOverlay?.()
  }, [transitStopPath])

  useEffect(() => {
    transitMapVisibleRef.current = transitMapVisible
    mapInstanceRef.current?._refreshTransitOverlay?.()
    mapInstanceRef.current?._updateMetroVehicles?.()
    mapInstanceRef.current?._refitMainBounds?.()
  }, [transitMapVisible])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    const initMap = () => {
      if (typeof window !== "undefined" && (window as any).L) {
        const L = (window as any).L

        const map = L.map(mapRef.current, {
          maxZoom: 20,
          zoomSnap: 0.25,
        })

        const flyToUserView = (animated: boolean) => {
          const loc = userLocationRef.current
          if (!loc?.length) return
          const [lat, lng] = loc
          if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) return
          if (animated) {
            map.flyTo([lat, lng], USER_VIEW_ZOOM, {
              duration: FLY_TO_USER_DURATION_SEC,
              easeLinearity: 0.22,
            })
          } else {
            map.setView([lat, lng], USER_VIEW_ZOOM, { animate: false })
          }
        }

        setTimeout(() => {
          flyToUserView(true)
        }, 50)

        const highDpi =
          typeof window !== "undefined" && typeof window.devicePixelRatio === "number"
            ? window.devicePixelRatio >= 2
            : false

        if (mapboxToken) {
          // Path must include /512/ to match tileSize 512 + zoomOffset -1 (otherwise 256px tiles scale up and look soft)
          const mapboxRetina = highDpi ? "@2x" : ""
          L.tileLayer(
            `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}${mapboxRetina}?access_token=${mapboxToken}`,
            {
              attribution:
                '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
              tileSize: 512,
              zoomOffset: -1,
              maxZoom: 22,
              maxNativeZoom: 22,
            },
          ).addTo(map)
        } else {
          L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 20,
            maxNativeZoom: 20,
            detectRetina: true,
          }).addTo(map)
        }

        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background: #dc2626;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 15px rgba(220, 38, 38, 0.6);
              animation: pulse 2s ease-in-out infinite;
              position: relative;
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        L.marker(userLocation, { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="color: black; font-weight: 600; text-align: center; padding: 8px;">
              <div style="color: #dc2626; font-size: 14px; margin-bottom: 4px;">📍 Your Location</div>
              <div style="font-size: 12px; color: #666;">Technician will be dispatched here</div>
            </div>
          `)

        const metroLayer = L.layerGroup().addTo(map)
        const transitOverlay = L.layerGroup().addTo(map)

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
            const b = L.latLngBounds(valid.map((p) => [p.lat, p.lng]))
            if (b.isValid()) {
              map.fitBounds(b, { padding: [48, 48], maxZoom: 15, animate: true })
              return
            }
          }
          flyToUserView(false)
        }

        const refreshTransitOverlay = () => {
          transitOverlay.clearLayers()
          if (!transitMapVisibleRef.current) {
            refitMainBounds()
            return
          }
          const path = transitStopPathRef.current
          if (!path?.length) {
            refitMainBounds()
            return
          }
          const valid = path.filter(
            (p) =>
              typeof p.lat === "number" &&
              typeof p.lng === "number" &&
              !Number.isNaN(p.lat) &&
              !Number.isNaN(p.lng),
          )
          if (valid.length >= 2) {
            L.polyline(
              valid.map((p) => [p.lat, p.lng]),
              { color: "#0d9488", weight: 4, opacity: 0.88 },
            ).addTo(transitOverlay)
          }
          valid.forEach((p, i) => {
            const marker = L.circleMarker([p.lat, p.lng], {
              radius: 6,
              color: "#fff",
              weight: 2,
              fillColor: "#0f766e",
              fillOpacity: 0.95,
            }).addTo(transitOverlay)
            marker.bindPopup(
              `<div style="font-size:12px;padding:4px 2px;color:#111;">
                <strong>${i + 1}. ${escapePopupText(p.label)}</strong>
                <div style="color:#666;font-size:11px;margin-top:4px;">${escapePopupText(p.placeCode)}</div>
              </div>`,
            )
          })
          refitMainBounds()
        }

        const busIconHtml = (bearing: number) => {
          const rot = Number.isFinite(bearing) ? bearing : 0
          return `
            <div style="
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));
            ">
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"
                style="transform: rotate(${rot}deg); transition: transform 0.3s ease;">
                <circle cx="12" cy="12" r="11" fill="#0f766e" stroke="#fff" stroke-width="2"/>
                <path fill="#fff" d="M5 9.5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v6c0 .6-.4 1-1 1h-1.5l1 2H17l-1-2H8l-1 2H5.5l1-2H5c-.6 0-1-.4-1-1v-6zm2.5 1c-.8 0-1.5.7-1.5 1.5S6.7 13.5 7.5 13.5 9 12.8 9 12 8.3 10.5 7.5 10.5zm9 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5-1.5z"/>
              </svg>
            </div>
          `
        }

        const vehiclesUrl = () => {
          const fromPanel = vehicleRouteIdsRef.current?.trim()
          if (fromPanel) {
            return `/api/metro-transit/vehicles?${new URLSearchParams({ routes: fromPanel }).toString()}`
          }
          const extra = process.env.NEXT_PUBLIC_METRO_TRANSIT_ROUTES?.trim()
          if (extra) {
            return `/api/metro-transit/vehicles?${new URLSearchParams({ routes: extra }).toString()}`
          }
          return "/api/metro-transit/vehicles"
        }

        const updateMetroVehicles = async () => {
          if (!transitMapVisibleRef.current) {
            metroLayer.clearLayers()
            return
          }
          try {
            const res = await fetch(vehiclesUrl())
            if (!res.ok) return
            const vehicles: MetroVehicle[] = await res.json()
            metroLayer.clearLayers()
            for (const v of vehicles) {
              const lat = v.latitude
              const lng = v.longitude
              if (typeof lat !== "number" || typeof lng !== "number") continue
              if (!isValidVehiclePosition(lat, lng)) continue
              const bearing = typeof v.bearing === "number" ? v.bearing : 0
              const icon = L.divIcon({
                className: "metro-bus-marker",
                html: busIconHtml(bearing),
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })
              const routeLabel = v.route_id ?? "?"
              const dir = v.direction ?? ""
              const speed = typeof v.speed === "number" && v.speed > 0 ? `${Math.round(v.speed)} mph` : "—"
              L.marker([lat, lng], { icon })
                .addTo(metroLayer)
                .bindPopup(`
                  <div style="color: #111; min-width: 140px; padding: 4px 2px;">
                    <div style="font-weight: 700; color: #0f766e; font-size: 14px;">Route ${routeLabel}</div>
                    <div style="font-size: 12px; color: #444; margin-top: 4px;">${dir ? `${dir} · ` : ""}${speed}</div>
                    <div style="font-size: 11px; color: #666; margin-top: 6px;">Metro Transit (live)</div>
                  </div>
                `)
            }
          } catch {
            /* ignore transient network errors */
          }
        }

        void updateMetroVehicles()
        const metroInterval = setInterval(() => void updateMetroVehicles(), METRO_POLL_MS)

        mapInstanceRef.current = map
        mapInstanceRef.current._refreshTransitOverlay = refreshTransitOverlay
        mapInstanceRef.current._refitMainBounds = refitMainBounds
        mapInstanceRef.current._updateMetroVehicles = updateMetroVehicles
        refreshTransitOverlay()

        const handleResize = () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
            mapInstanceRef.current._refitMainBounds?.()
          }
        }

        window.addEventListener("resize", handleResize)
        window.addEventListener("orientationchange", handleResize)

        mapInstanceRef.current._cleanup = () => {
          clearInterval(metroInterval)
          metroLayer.clearLayers()
          transitOverlay.clearLayers()
          map.removeLayer(transitOverlay)
          map.removeLayer(metroLayer)
          window.removeEventListener("resize", handleResize)
          window.removeEventListener("orientationchange", handleResize)
        }
      } else {
        setTimeout(initMap, 100)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        if (mapInstanceRef.current._cleanup) {
          mapInstanceRef.current._cleanup()
        }
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [userLocation])

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full animate-fade-in overflow-hidden bg-background" />
    </div>
  )
}
