/** Haversine distance in meters between WGS84 [lng, lat] pairs */

const R = 6371008.8

function toRad(d: number) {
  return (d * Math.PI) / 180
}

export function haversineM(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

export function totalPathLengthM(coords: [number, number][]): number {
  if (coords.length < 2) return 0
  let sum = 0
  for (let i = 0; i < coords.length - 1; i++) sum += haversineM(coords[i], coords[i + 1])
  return sum
}

/** Distance `d` meters from path start along polyline; wraps modulo total length */
export function pointAtDistanceAlongPath(coords: [number, number][], d: number): [number, number] {
  if (coords.length === 0) return [0, 0]
  if (coords.length === 1) return [coords[0][0], coords[0][1]]
  const total = totalPathLengthM(coords)
  if (total < 1e-6) return [coords[0][0], coords[0][1]]
  let dist = ((d % total) + total) % total
  for (let i = 0; i < coords.length - 1; i++) {
    const seg = haversineM(coords[i], coords[i + 1])
    if (dist <= seg) {
      const t = seg < 1e-6 ? 0 : dist / seg
      const lng = coords[i][0] + t * (coords[i + 1][0] - coords[i][0])
      const lat = coords[i][1] + t * (coords[i + 1][1] - coords[i][1])
      return [lng, lat]
    }
    dist -= seg
  }
  return [coords[coords.length - 1][0], coords[coords.length - 1][1]]
}

export function mphToMps(mph: number) {
  return mph * 0.44704
}
