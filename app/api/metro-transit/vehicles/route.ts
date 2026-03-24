import { NextResponse } from "next/server"
import { transit_realtime } from "gtfs-realtime-bindings"

export const dynamic = "force-dynamic"

/**
 * Metro Transit publishes GTFS-RT vehicle positions (~10s refresh on their side).
 * We fetch this single protobuf feed once per request (not N× per route) to stay light on their servers.
 * @see https://svc.metrotransit.org/mtgtfs/vehiclepositions.pb
 */
const VEHICLE_POSITIONS_URL = "https://svc.metrotransit.org/mtgtfs/vehiclepositions.pb"

export type MetroVehicleJson = {
  id: string
  trip_id: string
  route_id: string
  direction?: string
  latitude: number
  longitude: number
  bearing?: number
  /** miles per hour */
  speed?: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const routesParam = searchParams.get("routes")
  const routeFilter = routesParam
    ? routesParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
    : null

  try {
    const res = await fetch(VEHICLE_POSITIONS_URL, {
      cache: "no-store",
      headers: { Accept: "application/x-protobuf, application/octet-stream, */*" },
    })
    if (!res.ok) {
      return NextResponse.json([], { status: 200 })
    }

    const buf = await res.arrayBuffer()
    const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buf))
    const out: MetroVehicleJson[] = []

    for (const entity of feed.entity ?? []) {
      const vp = entity.vehicle
      if (!vp?.position) continue

      const lat = vp.position.latitude
      const lng = vp.position.longitude
      if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) continue

      const routeId = vp.trip?.routeId ?? ""
      if (routeFilter?.length && !routeFilter.includes(routeId)) continue

      const tripId = vp.trip?.tripId ?? entity.id
      const speedMps = typeof vp.position.speed === "number" ? vp.position.speed : 0
      const speedMph = speedMps * 2.23694

      out.push({
        id: entity.id,
        trip_id: tripId,
        route_id: routeId,
        latitude: lat,
        longitude: lng,
        bearing: typeof vp.position.bearing === "number" ? vp.position.bearing : undefined,
        speed: speedMph > 0 ? speedMph : undefined,
      })
    }

    return NextResponse.json(out)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
