/**
 * Single place to reason about “where is dispatch meeting the customer?”
 * — not GPS hardware permission alone, but service location source.
 */
export type ServiceLocationKind =
  | "pending"
  | "live_gps"
  | "saved_address"
  | "map_pin"
  | "default_area"

export function getServiceLocationKind(params: {
  userLocation: [number, number] | null
  liveLocationMode: boolean
  serviceLocationPending: boolean
  locationDisplayLabel: string | null
  defaultCenter: readonly [number, number]
}): ServiceLocationKind {
  const { userLocation, liveLocationMode, serviceLocationPending, locationDisplayLabel, defaultCenter } = params

  if (!userLocation) return "pending"
  if (serviceLocationPending) return "pending"

  const label = locationDisplayLabel?.trim()
  if (label) return "saved_address"

  if (liveLocationMode) return "live_gps"

  const [lat, lng] = userLocation
  const [dLat, dLng] = defaultCenter
  const atDefault = Math.abs(lat - dLat) < 1e-5 && Math.abs(lng - dLng) < 1e-5
  if (atDefault) return "default_area"

  return "map_pin"
}

export function truncateLabel(s: string, max = 46): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}
