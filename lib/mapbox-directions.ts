/** Client-side Mapbox Directions API (driving) — uses public map token */

export type DrivingRouteResult = {
  geometry: { type: "LineString"; coordinates: number[][] }
  distanceM: number
  durationSec: number
}

export async function fetchDrivingRoute(
  from: [number, number],
  to: [number, number],
  accessToken: string,
): Promise<DrivingRouteResult | null> {
  const a = `${from[0]},${from[1]}`
  const b = `${to[0]},${to[1]}`
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${a};${b}?geometries=geojson&overview=full&access_token=${encodeURIComponent(accessToken)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      routes?: Array<{
        geometry?: { type?: string; coordinates?: number[][] }
        distance?: number
        duration?: number
      }>
    }
    const route = data.routes?.[0]
    const g = route?.geometry
    if (!g || g.type !== "LineString" || !Array.isArray(g.coordinates)) return null
    return {
      geometry: { type: "LineString", coordinates: g.coordinates },
      distanceM: route.distance ?? 0,
      durationSec: route.duration ?? 0,
    }
  } catch {
    return null
  }
}

export function formatDriveEta(durationSec: number, distanceM: number) {
  const min = Math.floor(durationSec / 60)
  const sec = Math.round(durationSec % 60)
  const km = distanceM / 1000
  const timeStr = min >= 1 ? `${min} min ${sec}s` : `${sec}s`
  const distStr = km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(distanceM)} m`
  return { timeStr, distStr }
}
