"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { FloatingMenu } from "@/components/floating-menu"
import { MapComponent } from "@/components/map-component"
import { LocationPermissionModal } from "@/components/location-permission-modal"
import { TransitRoutesPanel } from "@/components/transit-routes-panel"
import type { TransitStopMapPoint } from "@/lib/nextrip"
import { toast } from "sonner"

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [vehicleRouteIds, setVehicleRouteIds] = useState<string | null>(null)
  const [transitStopPath, setTransitStopPath] = useState<TransitStopMapPoint[] | null>(null)
  const [transitPanelExpanded, setTransitPanelExpanded] = useState(false)
  /** Buses + route overlay; independent of panel so we can show “Show transit” while transit stays on */
  const [transitMapVisible, setTransitMapVisible] = useState(true)
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

  useEffect(() => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    if (url.searchParams.get("toast") !== "coming-soon") return
    toast.info("More features coming soon")
    url.searchParams.delete("toast")
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
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
    <div className="h-[100dvh] w-screen overflow-hidden bg-black">
      <div className="mx-auto flex h-full w-full max-w-[1400px] overflow-hidden">
        <aside className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:px-8">
          <p className="max-w-[20rem] text-center font-serif text-2xl font-medium leading-relaxed text-[#d9d9d9]">
            Share with your community Friends, families coworkers. We will get to you immediately.
          </p>
        </aside>

        <div className="mx-auto flex h-full w-full max-w-[560px] flex-col overflow-hidden">
          <Navigation userLocation={userLocation} frameClassName="max-w-[560px]" />
          <main className="relative min-h-0 flex-1 overflow-hidden">
            {userLocation ? (
              <>
                <div className="w-full h-full min-h-0 box-border flex flex-col px-3 pb-0 sm:px-4">
                  <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-t-2xl border border-[#c9b8a3] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]">
                    <MapComponent
                      userLocation={userLocation}
                      vehicleRouteIds={vehicleRouteIds}
                      transitStopPath={transitStopPath}
                      transitMapVisible={transitMapVisible}
                    />
                    <TransitRoutesPanel
                      expanded={transitPanelExpanded}
                      onExpandedChange={(next) => {
                        setTransitPanelExpanded(next)
                        if (next) setTransitMapVisible(true)
                        else setTransitMapVisible(false)
                      }}
                      vehicleRouteIds={vehicleRouteIds}
                      transitStopPath={transitStopPath}
                      onVehicleRouteFocus={setVehicleRouteIds}
                      onTransitStopsPlotted={setTransitStopPath}
                    />
                  </div>
                </div>
                <FloatingMenu userLocation={userLocation} />
              </>
            ) : (
              <div className="w-full h-full min-h-0 box-border flex flex-col px-3 pb-0 sm:px-4">
                <div className="flex-1 min-h-0 w-full rounded-t-2xl overflow-hidden flex items-center justify-center bg-white/70 border border-zinc-200/80">
                  <div className="text-center animate-pulse-subtle px-4">
                    <div className="text-lg text-zinc-900">
                      {isRequestingLocation ? "Getting your location..." : locationError || "Waiting for location..."}
                    </div>
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

        <aside className="hidden lg:block lg:flex-1" aria-hidden />
      </div>
    </div>
  )
}
