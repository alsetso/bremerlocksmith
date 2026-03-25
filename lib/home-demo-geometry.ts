/** Demo workflow map data — vehicles with paths; localhost admin + localStorage */

import { totalPathLengthM } from "@/lib/demo-vehicle-path"

export type DemoVehicle = {
  id: string
  name: string
  /** Ordered stops [lng, lat]; demo cycles which stop is “active” on the map */
  positions: [number, number][]
  /** Kept for saved data; not used for stop-dot demo */
  simulatedSpeedMph: number
  /** How often the active stop advances (ms) */
  positionRefreshMs: number
  /** Line color on map (hex) */
  trackColor?: string
}

export type DemoGeometry = {
  /** Meeting / service point for step 3; kept in sync with first vehicle start */
  designated: [number, number]
  vehicles: DemoVehicle[]
}

const LEGACY_ROUTE: [number, number][] = [
  [-93.2755, 44.9786],
  [-93.2742, 44.9788],
  [-93.2728, 44.979],
  [-93.2712, 44.9791],
  [-93.2695, 44.9789],
  [-93.2678, 44.9785],
  [-93.2662, 44.978],
]

function isLngLat(v: unknown): v is [number, number] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1])
  )
}

function isPath(v: unknown): v is [number, number][] {
  return Array.isArray(v) && v.length >= 2 && v.every(isLngLat)
}

/** Ensure at least two points for a line between stops */
export function ensureVehiclePath(positions: [number, number][]): [number, number][] {
  if (positions.length >= 2) return positions
  if (positions.length === 1) {
    const [lng, lat] = positions[0]
    return [positions[0], [lng + 0.0002, lat + 0.00015]]
  }
  return [
    [-93.2742, 44.9788],
    [-93.2735, 44.979],
  ]
}

function randomId() {
  return `v-${Math.random().toString(36).slice(2, 10)}`
}

const PALETTE = ["#34d399", "#22d3ee", "#a78bfa", "#fbbf24", "#fb7185", "#4ade80"]

function parseVehicle(raw: unknown): DemoVehicle | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === "string" && o.id ? o.id : randomId()
  const name = typeof o.name === "string" ? o.name : "Vehicle"
  if (!isPath(o.positions)) return null
  const positions = ensureVehiclePath(o.positions)
  const simulatedSpeedMph =
    typeof o.simulatedSpeedMph === "number" && Number.isFinite(o.simulatedSpeedMph) && o.simulatedSpeedMph > 0
      ? o.simulatedSpeedMph
      : 20
  const positionRefreshMs =
    typeof o.positionRefreshMs === "number" &&
    Number.isFinite(o.positionRefreshMs) &&
    o.positionRefreshMs >= 100 &&
    o.positionRefreshMs <= 60_000
      ? Math.round(o.positionRefreshMs)
      : 750
  const trackColor = typeof o.trackColor === "string" ? o.trackColor : undefined
  return { id, name, positions, simulatedSpeedMph, positionRefreshMs, trackColor }
}

function parseNewFormat(o: Record<string, unknown>): DemoGeometry | null {
  if (!Array.isArray(o.vehicles)) return null
  const vehicles = o.vehicles.map(parseVehicle).filter((v): v is DemoVehicle => v !== null)
  if (vehicles.length === 0) return null
  const designated = isLngLat(o.designated)
    ? ([o.designated[0], o.designated[1]] as [number, number])
    : vehicles[0].positions[0]
  return normalizeGeometry({ designated, vehicles })
}

type LegacyGeometry = {
  designated: [number, number]
  vehicleA: [number, number]
  vehicleB: [number, number]
  route: [number, number][]
}

function isLegacy(g: Record<string, unknown>): g is LegacyGeometry {
  return (
    isLngLat(g.designated) &&
    isLngLat(g.vehicleA) &&
    isLngLat(g.vehicleB) &&
    isPath(g.route)
  )
}

function migrateLegacy(legacy: LegacyGeometry): DemoGeometry {
  const r = legacy.route
  const split = Math.max(2, Math.floor(r.length / 2))
  const path1 = ensureVehiclePath(r.slice(0, split))
  let path2 = ensureVehiclePath(r.slice(split - 1))
  if (totalPathLengthM(path2) < 1) {
    const last = r[r.length - 1]
    path2 = ensureVehiclePath([last, [last[0] + 0.0002, last[1] + 0.0001]])
  }
  const vehicles: DemoVehicle[] = [
    {
      id: "demo-1",
      name: "Unit 12",
      positions: path1,
      simulatedSpeedMph: 22,
      positionRefreshMs: 600,
      trackColor: PALETTE[0],
    },
    {
      id: "demo-2",
      name: "Unit 7",
      positions: path2,
      simulatedSpeedMph: 18,
      positionRefreshMs: 900,
      trackColor: PALETTE[1],
    },
  ]
  return normalizeGeometry({ designated: legacy.designated, vehicles })
}

export function normalizeGeometry(g: DemoGeometry): DemoGeometry {
  if (!g.vehicles?.length) {
    return {
      designated: LEGACY_ROUTE[0],
      vehicles: [
        {
          id: "fallback-1",
          name: "Unit",
          positions: ensureVehiclePath([LEGACY_ROUTE[0], LEGACY_ROUTE[1]]),
          simulatedSpeedMph: 20,
          positionRefreshMs: 750,
          trackColor: PALETTE[0],
        },
      ],
    }
  }
  const vehicles = g.vehicles.map((v) => ({
    ...v,
    positions: ensureVehiclePath(v.positions),
    simulatedSpeedMph: Math.min(120, Math.max(1, v.simulatedSpeedMph)),
    positionRefreshMs: Math.min(30_000, Math.max(100, Math.round(v.positionRefreshMs))),
  }))
  const designated: [number, number] = vehicles[0]?.positions[0] ?? g.designated
  return { designated, vehicles }
}

export function emptyVehicle(): DemoVehicle {
  return {
    id: randomId(),
    name: "New unit",
    positions: ensureVehiclePath([
      [-93.2742, 44.9788],
      [-93.2732, 44.979],
    ]),
    simulatedSpeedMph: 20,
    positionRefreshMs: 750,
    trackColor: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  }
}

export const DEFAULT_HOME_DEMO_GEOMETRY: DemoGeometry = normalizeGeometry({
  designated: LEGACY_ROUTE[0],
  vehicles: [
    {
      id: "demo-1",
      name: "Unit 12",
      positions: ensureVehiclePath(LEGACY_ROUTE.slice(0, 4)),
      simulatedSpeedMph: 22,
      positionRefreshMs: 600,
      trackColor: PALETTE[0],
    },
    {
      id: "demo-2",
      name: "Unit 7",
      positions: ensureVehiclePath(LEGACY_ROUTE.slice(3)),
      simulatedSpeedMph: 18,
      positionRefreshMs: 900,
      trackColor: PALETTE[1],
    },
  ],
})

const STORAGE_KEY = "bremer-home-demo-geometry"

function parseStored(raw: string | null): DemoGeometry | null {
  if (!raw) return null
  try {
    const o = JSON.parse(raw) as unknown
    if (!o || typeof o !== "object") return null
    const rec = o as Record<string, unknown>
    if (Array.isArray(rec.vehicles)) {
      return parseNewFormat(rec)
    }
    if (isLegacy(rec)) {
      return migrateLegacy(rec)
    }
    return null
  } catch {
    return null
  }
}

export function loadHomeDemoGeometry(): DemoGeometry {
  if (typeof window === "undefined") return DEFAULT_HOME_DEMO_GEOMETRY
  try {
    const parsed = parseStored(localStorage.getItem(STORAGE_KEY))
    return parsed ? normalizeGeometry(parsed) : DEFAULT_HOME_DEMO_GEOMETRY
  } catch {
    return DEFAULT_HOME_DEMO_GEOMETRY
  }
}

export function saveHomeDemoGeometry(g: DemoGeometry) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeGeometry(g)))
  } catch {
    /* ignore */
  }
}

/** Dev-only: show geometry editor when the app is served from loopback (any port, e.g. next dev on 3000 or 3001). */
export function isLocalhostDevHostname(): boolean {
  if (typeof window === "undefined") return false
  const { hostname } = window.location
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
}
