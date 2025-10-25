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

        // Initialize map centered on user location
        const map = L.map(mapRef.current).setView(userLocation, 13)
        
        // After map is initialized, adjust view to position user location at target coordinates
        setTimeout(() => {
          const mapContainer = map.getContainer()
          const mapHeight = mapContainer.offsetHeight
          const mapWidth = mapContainer.offsetWidth
          
          // Target position: 549, 149px (22% from top)
          const targetX = 549
          const targetY = 149
          const targetPercentage = 22
          
          // Calculate the offset needed to position pin at target coordinates
          const point = map.latLngToContainerPoint(userLocation)
          const offsetX = targetX - point.x
          const offsetY = targetY - point.y
          
          // To move pin UPWARD in the frame, we need to move the map center DOWNWARD
          // This means we subtract the offset instead of adding it
          const newPoint = L.point(point.x - offsetX, point.y - offsetY)
          const newLatLng = map.containerPointToLatLng(newPoint)
          
          
          // Set the new center
          map.setView(newLatLng, 13)
        }, 100)

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
              width: 24px;
              height: 24px;
              background: #dc2626;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 15px rgba(220, 38, 38, 0.6);
              animation: pulse 2s ease-in-out infinite;
              position: relative;
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        L.marker(userLocation, { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="color: black; font-weight: 600; text-align: center; padding: 8px;">
              <div style="color: #dc2626; font-size: 14px; margin-bottom: 4px;">📍 Your Location</div>
              <div style="font-size: 12px; color: #666;">Technician will be dispatched here</div>
            </div>
          `)

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
