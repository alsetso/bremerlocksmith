/** Map container “page” overlays driven by `/map?view=` on the map route. */
export type MapView = "services" | "partners" | "drivers" | "accounts"

const MAP_VIEWS = new Set<string>(["services", "partners", "drivers", "accounts"])

export function parseMapView(value: string | null): MapView | null {
  if (!value) return null
  return MAP_VIEWS.has(value) ? (value as MapView) : null
}
