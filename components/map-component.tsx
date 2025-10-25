"use client"

import { useEffect, useRef } from "react"

interface MapComponentProps {
  userLocation: [number, number]
}

export function MapComponent({ userLocation }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Wait for Leaflet to load
    const initMap = () => {
      if (typeof window !== "undefined" && (window as any).L) {
        const L = (window as any).L

        // Initialize map
        const map = L.map(mapRef.current).setView(userLocation, 13)

        // Add dark tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }).addTo(map)

        // Add custom marker for user location
        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background: white;
              border: 3px solid black;
              border-radius: 50%;
              box-shadow: 0 0 10px rgba(255,255,255,0.5);
              animation: pulse-subtle 2s ease-in-out infinite;
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        L.marker(userLocation, { icon: customIcon })
          .addTo(map)
          .bindPopup('<div style="color: black; font-weight: 600;">Your Location</div>')

        mapInstanceRef.current = map
      } else {
        // Retry if Leaflet hasn't loaded yet
        setTimeout(initMap, 100)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [userLocation])

  return <div ref={mapRef} className="h-full w-full animate-fade-in" style={{ background: "#000" }} />
}
