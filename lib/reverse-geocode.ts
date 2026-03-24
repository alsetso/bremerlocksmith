const coordLine = (lat: number, lng: number) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`

/**
 * Human-readable line for a lat/lng (Mapbox, then BigDataCloud, then formatted coordinates).
 */
export async function reverseGeocodeMeetingLine(lat: number, lng: number): Promise<string> {
  const fallback = coordLine(lat, lng)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (mapboxToken) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,poi`,
      )
      if (res.ok) {
        const data = await res.json()
        const name = data?.features?.[0]?.place_name
        if (typeof name === "string" && name.trim()) return name.trim()
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    )
    if (!res.ok) return fallback
    const data = await res.json()
    const city = (data.city || data.locality || "").trim()
    const state = (data.principalSubdivisionCode || data.principalSubdivision || "").trim()
    const line = [city, state].filter(Boolean).join(", ")
    return line || fallback
  } catch {
    return fallback
  }
}
