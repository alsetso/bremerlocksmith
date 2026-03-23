import { NextResponse } from "next/server"
import type {
  NexTripAgency,
  NexTripDirection,
  NexTripRoute,
  NexTripStop,
  NexTripStopWithCoord,
} from "@/lib/nextrip"

const NEXTRIP_BASE = "https://svc.metrotransit.org/nextrip"

export type {
  NexTripAgency,
  NexTripDirection,
  NexTripRoute,
  NexTripStop,
  NexTripStopWithCoord,
} from "@/lib/nextrip"

/**
 * GET /api/transportation/nextrip — agencies + routes (cached 1h)
 * GET /api/transportation/nextrip?type=routes — routes only
 * GET /api/transportation/nextrip?type=agencies — agencies only
 * GET /api/transportation/nextrip?type=directions&route={route_id}
 * GET /api/transportation/nextrip?type=stops&route={route_id}&direction={direction_id}
 * GET /api/transportation/nextrip?type=stops-with-coords&route={route_id}&direction={direction_id}
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const route = searchParams.get("route")
  const direction = searchParams.get("direction")

  try {
    if (type === "directions") {
      if (!route?.trim()) {
        return NextResponse.json({ error: "route is required for type=directions" }, { status: 400 })
      }
      const res = await fetch(`${NEXTRIP_BASE}/directions/${encodeURIComponent(route.trim())}`, {
        next: { revalidate: 3600 },
      })
      if (!res.ok) throw new Error(`NexTrip directions: ${res.status}`)
      const directions: NexTripDirection[] = await res.json()
      return NextResponse.json(directions)
    }

    if (type === "stops") {
      if (!route?.trim()) {
        return NextResponse.json({ error: "route is required for type=stops" }, { status: 400 })
      }
      if (direction === null || direction === undefined || direction === "") {
        return NextResponse.json({ error: "direction is required for type=stops" }, { status: 400 })
      }
      const res = await fetch(
        `${NEXTRIP_BASE}/stops/${encodeURIComponent(route.trim())}/${encodeURIComponent(direction)}`,
        { next: { revalidate: 3600 } },
      )
      if (!res.ok) throw new Error(`NexTrip stops: ${res.status}`)
      const stops: NexTripStop[] = await res.json()
      return NextResponse.json(stops)
    }

    if (type === "stops-with-coords") {
      if (!route?.trim()) {
        return NextResponse.json({ error: "route is required for type=stops-with-coords" }, { status: 400 })
      }
      if (direction === null || direction === undefined || direction === "") {
        return NextResponse.json(
          { error: "direction is required for type=stops-with-coords" },
          { status: 400 },
        )
      }
      const r = route.trim()
      const d = direction
      const stopsRes = await fetch(`${NEXTRIP_BASE}/stops/${encodeURIComponent(r)}/${encodeURIComponent(d)}`, {
        next: { revalidate: 3600 },
      })
      if (!stopsRes.ok) throw new Error(`NexTrip stops: ${stopsRes.status}`)
      const stops: NexTripStop[] = await stopsRes.json()
      const enriched: NexTripStopWithCoord[] = await Promise.all(
        stops.map(async (s) => {
          const depRes = await fetch(
            `${NEXTRIP_BASE}/${encodeURIComponent(r)}/${encodeURIComponent(d)}/${encodeURIComponent(s.place_code)}`,
            { cache: "no-store" },
          )
          if (!depRes.ok) {
            return { ...s, latitude: null, longitude: null }
          }
          const data = (await depRes.json()) as {
            stops?: { stop_id?: number; latitude?: number; longitude?: number; description?: string }[]
          }
          const first = data.stops?.[0]
          return {
            place_code: s.place_code,
            description: s.description,
            latitude: typeof first?.latitude === "number" ? first.latitude : null,
            longitude: typeof first?.longitude === "number" ? first.longitude : null,
            stop_id: first?.stop_id,
          }
        }),
      )
      return NextResponse.json(enriched)
    }

    if (type === "routes") {
      const res = await fetch(`${NEXTRIP_BASE}/routes`, { next: { revalidate: 3600 } })
      if (!res.ok) throw new Error(`NexTrip routes: ${res.status}`)
      const routes: NexTripRoute[] = await res.json()
      return NextResponse.json({ routes })
    }

    if (type === "agencies") {
      const res = await fetch(`${NEXTRIP_BASE}/agencies`, { next: { revalidate: 3600 } })
      if (!res.ok) throw new Error(`NexTrip agencies: ${res.status}`)
      const agencies: NexTripAgency[] = await res.json()
      return NextResponse.json({ agencies })
    }

    const [agenciesRes, routesRes] = await Promise.all([
      fetch(`${NEXTRIP_BASE}/agencies`, { next: { revalidate: 3600 } }),
      fetch(`${NEXTRIP_BASE}/routes`, { next: { revalidate: 3600 } }),
    ])

    if (!agenciesRes.ok) throw new Error(`NexTrip agencies: ${agenciesRes.status}`)
    if (!routesRes.ok) throw new Error(`NexTrip routes: ${routesRes.status}`)

    const agencies: NexTripAgency[] = await agenciesRes.json()
    const routes: NexTripRoute[] = await routesRes.json()

    return NextResponse.json({ agencies, routes })
  } catch (e) {
    const message = e instanceof Error ? e.message : "NexTrip request failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
