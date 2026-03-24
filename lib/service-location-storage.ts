/**
 * Single persisted snapshot for “where we meet the customer” — coordinates, live vs fixed,
 * optional display line, and whether the user still needs to pick a spot.
 * Keeps React state and reloads aligned without scattering localStorage keys.
 */
export const SERVICE_LOCATION_STORAGE_KEY = "bremer-service-location"

export type StoredServiceLocationV1 = {
  v: 1
  lat: number
  lng: number
  /** True when service location follows live GPS (Find me / device). */
  live: boolean
  /** Address line or coordinates string for nav + dashboard; null if not resolved yet. */
  label: string | null
  /** User has not committed a real meeting point yet. */
  servicePending: boolean
}

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n)
}

export function parseStoredServiceLocation(raw: string | null): StoredServiceLocationV1 | null {
  if (!raw?.trim()) return null
  try {
    const o = JSON.parse(raw) as Partial<StoredServiceLocationV1>
    if (o.v !== 1) return null
    if (!isFiniteNum(o.lat) || !isFiniteNum(o.lng)) return null
    if (typeof o.live !== "boolean") return null
    if (typeof o.servicePending !== "boolean") return null
    const label = o.label == null ? null : typeof o.label === "string" ? o.label : null
    return {
      v: 1,
      lat: o.lat,
      lng: o.lng,
      live: o.live,
      label,
      servicePending: o.servicePending,
    }
  } catch {
    return null
  }
}

export function readStoredServiceLocation(): StoredServiceLocationV1 | null {
  if (typeof window === "undefined") return null
  return parseStoredServiceLocation(localStorage.getItem(SERVICE_LOCATION_STORAGE_KEY))
}

export function writeStoredServiceLocation(s: StoredServiceLocationV1): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SERVICE_LOCATION_STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* quota / private mode */
  }
}
