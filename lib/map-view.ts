/** Map container “page” overlays driven by `/?view=` on the home route. */
export type MapView = "services" | "partners" | "drivers"

const MAP_VIEWS = new Set<string>(["services", "partners", "drivers"])

export function parseMapView(value: string | null): MapView | null {
  if (!value) return null
  return MAP_VIEWS.has(value) ? (value as MapView) : null
}
