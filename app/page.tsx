"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { FloatingMenu } from "@/components/floating-menu"
import { MapComponent } from "@/components/map-component"
import { LocationPermissionModal } from "@/components/location-permission-modal"

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false)
  const [isRequestingLocation, setIsRequestingLocation] = useState<boolean>(false)

  const requestUserLocation = () => {
    setIsRequestingLocation(true)
    setLocationError(null)

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          // Verify location is reasonable (not default Germany coordinates)
          // Check if coordinates are in a reasonable range (not exactly Germany default)
          if (lat === 53.0793 && lng === 8.8017) {
            setLocationError("Unable to verify your location. Using default location.")
            // Use default US location (Minneapolis, MN)
            setUserLocation([44.9778, -93.2650])
          } else {
            setUserLocation([lat, lng])
            localStorage.setItem('location-permission-status', 'granted')
          }
          setIsRequestingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError("Unable to get your location. Using default location.")
          // Use default US location (Minneapolis, MN) instead of Germany
          setUserLocation([44.9778, -93.2650])
          localStorage.setItem('location-permission-status', 'denied')
          setIsRequestingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      setLocationError("Geolocation not supported. Using default location.")
      // Use default US location (Minneapolis, MN)
      setUserLocation([44.9778, -93.2650])
      setIsRequestingLocation(false)
    }
  }

  useEffect(() => {
    // Show permission modal on every page reload
    setShowPermissionModal(true)
    
    // Check if permission was previously granted and try to get location
    const permissionStatus = localStorage.getItem('location-permission-status')
    if (permissionStatus === 'granted') {
      // Still show modal but also try to get location in background
      requestUserLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAcceptLocation = () => {
    setShowPermissionModal(false)
    localStorage.setItem('location-permission-status', 'granted')
    requestUserLocation()
  }

  const handleDenyLocation = () => {
    setShowPermissionModal(false)
    localStorage.setItem('location-permission-status', 'denied')
    setLocationError("Location access denied. Using default location.")
    // Use default US location (Minneapolis, MN) instead of Germany
    setUserLocation([44.9778, -93.2650])
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black overflow-hidden">
      <Navigation />
      <main className="flex-1 relative overflow-hidden min-h-0">
        {userLocation ? (
          <>
            <MapComponent userLocation={userLocation} />
            <FloatingMenu userLocation={userLocation} />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center animate-pulse-subtle">
              <div className="text-lg text-foreground">
                {isRequestingLocation ? "Getting your location..." : locationError || "Waiting for location..."}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showPermissionModal}
        onAccept={handleAcceptLocation}
        onDeny={handleDenyLocation}
      />
    </div>
  )
}
