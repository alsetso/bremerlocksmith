"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { FloatingMenu } from "@/components/floating-menu"
import { MapComponent } from "@/components/map-component"

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    // Get user's current location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError("Unable to get your location")
          // Default to Bremen, Germany coordinates
          setUserLocation([53.0793, 8.8017])
        },
      )
    } else {
      setLocationError("Geolocation not supported")
      // Default to Bremen, Germany coordinates
      setUserLocation([53.0793, 8.8017])
    }
  }, [])

  return (
    <div className="h-screen w-full flex flex-col bg-black">
      <Navigation />
      <main className="flex-1 relative">
        {userLocation ? (
          <>
            <MapComponent userLocation={userLocation} />
            <FloatingMenu userLocation={userLocation} />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center animate-pulse-subtle">
              <div className="text-lg text-foreground">{locationError || "Locating you..."}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
