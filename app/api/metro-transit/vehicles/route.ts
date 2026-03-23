import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** Default frequent Twin Cities bus routes (NexTrip `route_id` values). Override with `?routes=2,5,901`. */
const DEFAULT_ROUTE_IDS = [
  "2",
  "5",
  "6",
  "10",
  "12",
  "17",
  "18",
  "21",
  "4",
  "19",
  "54",
  "72",
  "84",
  "94",
]

const METRO_BASE = "https://svc.metrotransit.org"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const routesParam = searchParams.get("routes")
  const routeIds = routesParam
    ? routesParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
    : DEFAULT_ROUTE_IDS

  try {
    const results = await Promise.all(
      routeIds.map(async (routeId) => {
        const url = `${METRO_BASE}/nextrip/vehicles/${encodeURIComponent(routeId)}`
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) return [] as unknown[]
        const data = await res.json()
        return Array.isArray(data) ? data : []
      }),
    )

    const merged = results.flat()
    return NextResponse.json(merged)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
