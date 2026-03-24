"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface LocationPermissionModalProps {
  isOpen: boolean
  /** Lat, lng from tapping the main map */
  pickerPin: [number, number] | null
  onPickerPinSet: (lat: number, lng: number) => void
  onPickerPinClear: () => void
  onUseCurrentLocation: () => void
  /** Turn off live GPS / Find me while keeping the panel open. */
  onStopLiveLocation: () => void
  /** Live GPS is the active service location (map shows Find me). */
  liveLocationActive?: boolean
  onUseAddress: (coords: [number, number], placeName: string) => void
  onDeny: () => void
}

type GeocodeFeature = {
  id: string
  place_name: string
  center?: [number, number]
  geometry?: { type: string; coordinates?: number[] }
}

function lngLatFromFeature(f: GeocodeFeature): [number, number] | null {
  if (Array.isArray(f.center) && f.center.length >= 2) {
    return [f.center[0], f.center[1]]
  }
  const coords = f.geometry?.coordinates
  if (Array.isArray(coords) && coords.length >= 2) {
    return [coords[0], coords[1]]
  }
  return null
}

export function LocationPermissionModal({
  isOpen,
  pickerPin,
  onPickerPinSet,
  onPickerPinClear,
  onUseCurrentLocation,
  onStopLiveLocation,
  liveLocationActive = false,
  onUseAddress,
  onDeny,
}: LocationPermissionModalProps) {
  const [isRequestingGps, setIsRequestingGps] = useState(false)
  const [addressQuery, setAddressQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<GeocodeFeature[]>([])
  const [confirmedLocation, setConfirmedLocation] = useState<{
    lat: number
    lng: number
    placeName: string
  } | null>(null)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
  const [deviceGps, setDeviceGps] = useState<{ lat: number; lng: number } | null>(null)
  const [deviceGpsAddress, setDeviceGpsAddress] = useState<string | null>(null)
  const [deviceGpsLoading, setDeviceGpsLoading] = useState(false)
  const [deviceGpsError, setDeviceGpsError] = useState<string | null>(null)

  const mapboxToken =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  const reverseGeocodeBigDataCloud = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      )
      if (!res.ok) return null
      const data = await res.json()
      const city = (data.city || data.locality || "").trim()
      const state = (data.principalSubdivisionCode || data.principalSubdivision || "").trim()
      const line1 = [city, state].filter(Boolean).join(", ")
      const country = (data.countryName || "").trim()
      if (line1 && country) return `${line1}, ${country}`
      if (line1) return line1
      if (country) return country
      return null
    } catch {
      return null
    }
  }, [])

  /** Full address for display (Mapbox preferred, then BigDataCloud). */
  const reverseGeocodeDisplayAddress = useCallback(
    async (lng: number, lat: number): Promise<string> => {
      if (mapboxToken) {
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi,place&limit=1&access_token=${mapboxToken}`
          const res = await fetch(url)
          if (res.ok) {
            const data = await res.json()
            const name = data?.features?.[0]?.place_name
            if (typeof name === "string" && name.trim()) return name.trim()
          }
        } catch {
          /* fall through */
        }
      }
      const fallback = await reverseGeocodeBigDataCloud(lat, lng)
      return fallback ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    },
    [mapboxToken, reverseGeocodeBigDataCloud],
  )

  const reverseGeocodeLabel = useCallback(
    async (lng: number, lat: number): Promise<string> => {
      if (!mapboxToken) return "Pinned location"
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi,place&limit=1&access_token=${mapboxToken}`
        const res = await fetch(url)
        if (!res.ok) return "Pinned location"
        const data = await res.json()
        const name = data?.features?.[0]?.place_name
        return typeof name === "string" && name.trim() ? name.trim() : "Pinned location"
      } catch {
        return "Pinned location"
      }
    },
    [mapboxToken],
  )

  useEffect(() => {
    if (!isOpen) {
      setIsRequestingGps(false)
      setDeviceGps(null)
      setDeviceGpsAddress(null)
      setDeviceGpsLoading(false)
      setDeviceGpsError(null)
      return
    }
    setAddressQuery("")
    setSuggestions([])
    setConfirmedLocation(null)
    setIsReverseGeocoding(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setDeviceGpsError("Geolocation not supported")
      setDeviceGpsLoading(false)
      return
    }

    let cancelled = false
    setDeviceGpsLoading(true)
    setDeviceGpsError(null)
    setDeviceGps(null)
    setDeviceGpsAddress(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setDeviceGps({ lat, lng })
        void reverseGeocodeDisplayAddress(lng, lat).then((addr) => {
          if (!cancelled) setDeviceGpsAddress(addr)
        })
        setDeviceGpsLoading(false)
      },
      (err: GeolocationPositionError) => {
        if (cancelled) return
        setDeviceGpsLoading(false)
        if (err.code === 1) {
          setDeviceGpsError("GPS unavailable — allow location to see coordinates here.")
        } else {
          setDeviceGpsError("Could not read GPS position.")
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )

    return () => {
      cancelled = true
    }
  }, [isOpen, reverseGeocodeDisplayAddress])

  useEffect(() => {
    if (!isOpen || !pickerPin) return
    const [lat, lng] = pickerPin
    let cancelled = false
    setIsReverseGeocoding(true)
    void reverseGeocodeLabel(lng, lat)
      .then((placeName) => {
        if (cancelled) return
        setConfirmedLocation({ lat, lng, placeName })
        setAddressQuery(placeName)
      })
      .finally(() => {
        if (!cancelled) setIsReverseGeocoding(false)
      })
    return () => {
      cancelled = true
    }
  }, [pickerPin, isOpen, reverseGeocodeLabel])

  useEffect(() => {
    if (!isOpen) return
    const query = addressQuery.trim()
    if (query.length < 2 || !mapboxToken) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    void (async () => {
      setIsSearching(true)
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&limit=5&types=address,place,postcode,locality&access_token=${mapboxToken}`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
          setSuggestions([])
          return
        }
        const data = await res.json()
        const raw = Array.isArray(data?.features) ? data.features : []
        const picks: GeocodeFeature[] = raw
          .map((f: GeocodeFeature & { id?: string }, i: number) => ({
            id: typeof f.id === "string" ? f.id : `feat-${i}`,
            place_name: f.place_name,
            center: f.center,
            geometry: f.geometry,
          }))
          .filter((f: GeocodeFeature) => lngLatFromFeature(f) !== null)
          .slice(0, 5)
        setSuggestions(picks)
      } catch {
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    })()

    return () => {
      controller.abort()
    }
  }, [addressQuery, mapboxToken])

  if (!isOpen) return null

  const handleUseGps = () => {
    if (liveLocationActive) {
      onStopLiveLocation()
      return
    }
    setIsRequestingGps(true)
    onUseCurrentLocation()
  }

  const handleSuggestionPick = (f: GeocodeFeature) => {
    const ll = lngLatFromFeature(f)
    if (!ll) return
    const [lng, lat] = ll
    setConfirmedLocation({ lng, lat, placeName: f.place_name })
    setAddressQuery(f.place_name)
    onPickerPinSet(lat, lng)
  }

  const handleLookupTypedAddress = async () => {
    const q = addressQuery.trim()
    if (q.length < 5 || !mapboxToken) return
    setIsSearching(true)
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=1&types=address,place,postcode,locality&access_token=${mapboxToken}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      const f = data?.features?.[0] as GeocodeFeature | undefined
      if (!f) return
      const ll = lngLatFromFeature(f)
      if (!ll) return
      const [lng, lat] = ll
      setConfirmedLocation({ lng, lat, placeName: f.place_name })
      onPickerPinSet(lat, lng)
    } finally {
      setIsSearching(false)
    }
  }

  const handleUseAddress = () => {
    if (!confirmedLocation) return
    onUseAddress([confirmedLocation.lat, confirmedLocation.lng], confirmedLocation.placeName)
  }

  const handleClearPin = () => {
    setConfirmedLocation(null)
    onPickerPinClear()
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden text-zinc-200">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto text-xs">
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Choose GPS, search an address, or tap the map above. <span className="text-zinc-400">Not Now</span> uses the
          default area — reopen anytime from <span className="text-zinc-400">Dashboard → Location</span>.
        </p>
        <div className="space-y-1 border-b border-zinc-700/80 pb-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">Current location (GPS)</p>
          {deviceGpsLoading && <p className="text-[11px] text-zinc-500">Reading GPS…</p>}
          {deviceGpsError && !deviceGpsLoading && <p className="text-[11px] text-zinc-500">{deviceGpsError}</p>}
          {!deviceGpsLoading && deviceGps && (
            <>
              <p className="text-sm leading-snug text-zinc-100">
                {deviceGpsAddress ?? <span className="text-zinc-500">Resolving address…</span>}
              </p>
              <p className="font-mono text-[11px] text-zinc-400">
                {deviceGps.lat.toFixed(6)}, {deviceGps.lng.toFixed(6)}
              </p>
            </>
          )}
        </div>

        <label htmlFor="manual-address" className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-zinc-400">
          Enter address instead
        </label>
        <input
          id="manual-address"
          type="text"
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
          placeholder="Start typing your address..."
          autoComplete="street-address"
          className="w-full rounded-md border border-zinc-600/80 bg-zinc-950/80 px-2.5 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-500"
        />
        <p className="mt-1 text-[11px] text-zinc-500">
          {isSearching
            ? "Searching…"
            : isReverseGeocoding
              ? "Reading pin from map…"
              : "Pick a suggestion, confirm what you typed, or tap the map above to drop a pin."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleLookupTypedAddress()}
            disabled={addressQuery.trim().length < 5 || isSearching || !mapboxToken}
            className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm typed address
          </button>
          {(confirmedLocation || pickerPin) && (
            <button
              type="button"
              onClick={handleClearPin}
              className="rounded-md border border-zinc-600 bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800/80"
            >
              Clear pin
            </button>
          )}
        </div>

        <div className="space-y-1">
          {suggestions.length > 0 ? (
            suggestions.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSuggestionPick(f)}
                className="w-full rounded-md border border-zinc-600/50 bg-transparent px-2 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800/50"
              >
                {f.place_name}
              </button>
            ))
          ) : (
            <div className="px-1 py-2 text-zinc-500">
              {addressQuery.trim().length >= 2 ? "No matches yet." : "No suggestions yet. Start typing to search."}
            </div>
          )}
        </div>

        {!mapboxToken && (
          <p className="text-[11px] text-amber-200/80">Add a Mapbox token to enable address search.</p>
        )}

        {confirmedLocation && (
          <div className="py-1">
            <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/90">Confirm location</div>
            <p className="mt-1 text-sm leading-snug text-zinc-100">{confirmedLocation.placeName}</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              If this matches the pin on the map, continue with this address.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2 pt-1">
        {confirmedLocation && (
          <Button
            type="button"
            size="lg"
            onClick={handleUseAddress}
            className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Use this address
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            variant="outline"
            onClick={onDeny}
            disabled={isRequestingGps}
            className="h-11 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          >
            Not Now
          </Button>
          <Button
            size="lg"
            onClick={handleUseGps}
            disabled={isRequestingGps && !liveLocationActive}
            className={
              liveLocationActive
                ? "h-11 border border-amber-500/60 bg-amber-950/80 text-amber-100 hover:bg-amber-900/80"
                : "h-11 bg-white text-zinc-900 hover:bg-zinc-100"
            }
          >
            {isRequestingGps && !liveLocationActive
              ? "Requesting…"
              : liveLocationActive
                ? "Do not use current location"
                : "Use current location"}
          </Button>
        </div>
      </div>
    </div>
  )
}
