"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { FloatingMenu } from "@/components/floating-menu"
import { MapComponent } from "@/components/map-component"
import { LocationPermissionModal } from "@/components/location-permission-modal"
import { HomeDashboard } from "@/components/home-dashboard"
import { PaymentsModal } from "@/components/payments-modal"
import { MapBottomSheet } from "@/components/map-bottom-sheet"
import { MapToaster } from "@/components/map-toaster"
import { toast } from "sonner"
import { reverseGeocodeMeetingLine } from "@/lib/reverse-geocode"
import { readStoredServiceLocation, writeStoredServiceLocation } from "@/lib/service-location-storage"

const DISPATCH_PHONE_DISPLAY = "(952) 923 0248"
const DISPATCH_PHONE_E164 = "+19529230248"

/** Fallback map center while the location modal is open (Minneapolis, MN). */
const DEFAULT_MAP_CENTER: [number, number] = [44.9778, -93.265]

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [paymentsOpen, setPaymentsOpen] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false)
  const [isRequestingLocation, setIsRequestingLocation] = useState<boolean>(false)
  /** When the user picks an address (typed, suggestion, or map pin), show that under the logo and in the service flow. */
  const [locationDisplayLabel, setLocationDisplayLabel] = useState<string | null>(null)
  /** User skipped location in the permission step — show service flow with “Select service location” until they share a real location. */
  const [serviceLocationPending, setServiceLocationPending] = useState(false)
  /** Purple pin on the main map during the location modal (lat, lng). */
  const [pickerPin, setPickerPin] = useState<[number, number] | null>(null)
  /** After changing location from the service request flow, reopen that flow. */
  const [resumeServiceAfterLocation, setResumeServiceAfterLocation] = useState(false)
  /** User chose live GPS (Find me) vs a saved typed address. */
  const [liveLocationMode, setLiveLocationMode] = useState(true)
  /** Bumps when user enables live location so the map geolocate control runs. */
  const [findMeTriggerNonce, setFindMeTriggerNonce] = useState(0)
  /** Bottom sheet over the map: always leaves a peek bar; expands/collapses (never fully dismissed). */
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(true)

  /** Avoid applying an older reverse-geocode result if the user picks again quickly. */
  const mapLabelSeqRef = useRef(0)

  const locationPickerActive = showPermissionModal && userLocation === null
  const mapCenter = userLocation ?? DEFAULT_MAP_CENTER
  const showMainMap = userLocation !== null || locationPickerActive

  const requestUserLocation = () => {
    setIsRequestingLocation(true)
    setLocationError(null)

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          if (lat === 53.0793 && lng === 8.8017) {
            setLocationError("Unable to verify your location. Using default location.")
            setUserLocation([44.9778, -93.265])
          } else {
            setUserLocation([lat, lng])
            localStorage.setItem("location-permission-status", "granted")
          }
          setIsRequestingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError("Unable to get your location. Using default location.")
          setUserLocation([44.9778, -93.265])
          localStorage.setItem("location-permission-status", "denied")
          setIsRequestingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    } else {
      setLocationError("Geolocation not supported. Using default location.")
      setUserLocation([44.9778, -93.265])
      setIsRequestingLocation(false)
    }
  }

  useEffect(() => {
    if (showPermissionModal) setPickerPin(null)
  }, [showPermissionModal])

  useEffect(() => {
    if (showPermissionModal) setBottomSheetExpanded(true)
  }, [showPermissionModal])

  useEffect(() => {
    if (serviceModalOpen) setBottomSheetExpanded(true)
  }, [serviceModalOpen])

  useEffect(() => {
    if (paymentsOpen) setBottomSheetExpanded(true)
  }, [paymentsOpen])

  useEffect(() => {
    if (userLocation) setPickerPin(null)
  }, [userLocation])

  /** Persist meeting-point snapshot whenever service location state changes (single source for reloads). */
  useEffect(() => {
    if (typeof window === "undefined") return
    if (userLocation === null && !serviceLocationPending) return
    const lat = userLocation?.[0] ?? DEFAULT_MAP_CENTER[0]
    const lng = userLocation?.[1] ?? DEFAULT_MAP_CENTER[1]
    writeStoredServiceLocation({
      v: 1,
      lat,
      lng,
      live: liveLocationMode,
      label: locationDisplayLabel,
      servicePending: serviceLocationPending,
    })
  }, [userLocation, liveLocationMode, locationDisplayLabel, serviceLocationPending])

  useEffect(() => {
    setShowPermissionModal(true)

    const stored = readStoredServiceLocation()
    if (stored) {
      setUserLocation([stored.lat, stored.lng])
      setLiveLocationMode(stored.live)
      setLocationDisplayLabel(stored.label)
      setServiceLocationPending(stored.servicePending)
    }

    const permissionStatus = localStorage.getItem("location-permission-status")
    if (permissionStatus === "granted" && (!stored || stored.live)) {
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

  /** Close location panel and either return to Dashboard or resume service request flow. */
  const dismissLocationPanelWithResume = useCallback(() => {
    setShowPermissionModal(false)
    if (resumeServiceAfterLocation) {
      setServiceModalOpen(true)
      setResumeServiceAfterLocation(false)
    } else {
      setServiceModalOpen(false)
    }
  }, [resumeServiceAfterLocation])

  const handleUseCurrentLocation = () => {
    setPickerPin(null)
    setLocationDisplayLabel(null)
    setServiceLocationPending(false)
    setLiveLocationMode(true)
    localStorage.setItem("location-permission-status", "granted")
    requestUserLocation()
    setFindMeTriggerNonce((n) => n + 1)
    dismissLocationPanelWithResume()
  }

  const handleStopLiveLocation = () => {
    setLiveLocationMode(false)
    setLocationDisplayLabel(null)
    setPickerPin(null)
    setUserLocation(DEFAULT_MAP_CENTER)
    setServiceLocationPending(true)
    setLocationError(null)
    toast.info("Live location off. Set a spot on the map or choose an address.")
    dismissLocationPanelWithResume()
  }

  /** Map confirm — fixed pin + label for dashboard/nav; overrides live GPS; persisted via storage effect. */
  const handlePrimaryLocationFromMap = useCallback(
    async (lat: number, lng: number) => {
      mapLabelSeqRef.current += 1
      const seq = mapLabelSeqRef.current
      setUserLocation([lat, lng])
      setLiveLocationMode(false)
      setServiceLocationPending(false)
      setLocationError(null)
      setLocationDisplayLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      dismissLocationPanelWithResume()
      const line = await reverseGeocodeMeetingLine(lat, lng)
      if (seq !== mapLabelSeqRef.current) return
      setLocationDisplayLabel(line)
    },
    [dismissLocationPanelWithResume],
  )

  const handleGeolocateSuccess = (coords: [number, number]) => {
    setUserLocation(coords)
    setLiveLocationMode(true)
    setServiceLocationPending(false)
    setLocationDisplayLabel(null)
    setLocationError(null)
    localStorage.setItem("location-permission-status", "granted")
    dismissLocationPanelWithResume()
  }

  /** GPS denied / unavailable — pin service location to current map view (dropped pin). */
  const handleGeolocateFallback = (coords: [number, number]) => {
    setUserLocation(coords)
    setLiveLocationMode(false)
    setLocationDisplayLabel(null)
    setServiceLocationPending(true)
    localStorage.setItem("location-permission-status", "denied")
    setLocationError("Using map position. Allow location for live GPS.")
    dismissLocationPanelWithResume()
  }

  const handleUseAddress = (coords: [number, number], placeName: string) => {
    setPickerPin(null)
    setLocationDisplayLabel(placeName)
    setUserLocation(coords)
    setLocationError(null)
    setServiceLocationPending(false)
    setLiveLocationMode(false)
    localStorage.setItem("location-permission-status", "granted")
    dismissLocationPanelWithResume()
  }

  const handleDenyLocation = () => {
    setPickerPin(null)
    setLocationDisplayLabel(null)
    setServiceLocationPending(true)
    setLiveLocationMode(false)
    localStorage.setItem("location-permission-status", "denied")
    setLocationError("Location access denied. Using default area.")
    setUserLocation([44.9778, -93.2650])
    toast.message("You can set a meeting spot anytime from the Location card.", { duration: 4500 })
    dismissLocationPanelWithResume()
  }

  const openLocationFromDashboard = () => {
    setResumeServiceAfterLocation(false)
    setShowPermissionModal(true)
  }

  const openLocationFromServiceFlow = () => {
    setResumeServiceAfterLocation(true)
    setServiceModalOpen(false)
    setShowPermissionModal(true)
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
          <Navigation
            userLocation={userLocation}
            locationDisplayLabel={
              serviceLocationPending ? "Select service location" : locationDisplayLabel
            }
            frameClassName="max-w-[560px]"
          />
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {showMainMap ? (
              <>
                <div className="box-border flex min-h-0 flex-1 flex-col px-3 pb-0 sm:px-4">
                  <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
                    <div className="map-stack absolute inset-0 min-h-0 overflow-hidden">
                      <MapToaster />
                      <MapComponent
                        mapCenter={mapCenter}
                        vehicleRouteIds={null}
                        transitStopPath={null}
                        transitMapVisible
                        locationPickerActive={locationPickerActive}
                        pickerPin={pickerPin}
                        onLocationPick={(lat, lng) => setPickerPin([lat, lng])}
                        onPrimaryLocationFromMap={handlePrimaryLocationFromMap}
                        selectedLocationLabel={
                          !serviceLocationPending && locationDisplayLabel?.trim()
                            ? locationDisplayLabel.trim()
                            : null
                        }
                        showFindMeControl={showMainMap}
                        findMeTriggerNonce={findMeTriggerNonce}
                        onGeolocateSuccess={handleGeolocateSuccess}
                        onGeolocateFallback={handleGeolocateFallback}
                      />
                    </div>
                    <MapBottomSheet
                      lockExpanded={showPermissionModal}
                      expanded={bottomSheetExpanded}
                      onExpandedChange={setBottomSheetExpanded}
                      title={
                        showPermissionModal
                          ? "Location"
                          : paymentsOpen
                            ? "Payments"
                            : serviceModalOpen
                              ? "Service request"
                              : "Dashboard"
                      }
                    >
                      {showPermissionModal && (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                          <LocationPermissionModal
                            isOpen={showPermissionModal}
                            pickerPin={pickerPin}
                            onPickerPinSet={(lat, lng) => setPickerPin([lat, lng])}
                            onPickerPinClear={() => setPickerPin(null)}
                            onUseCurrentLocation={handleUseCurrentLocation}
                            onStopLiveLocation={handleStopLiveLocation}
                            liveLocationActive={Boolean(
                              userLocation &&
                                liveLocationMode &&
                                !serviceLocationPending &&
                                !locationDisplayLabel?.trim(),
                            )}
                            onUseAddress={handleUseAddress}
                            onDeny={handleDenyLocation}
                          />
                        </div>
                      )}
                      {!showPermissionModal && userLocation && !locationPickerActive && paymentsOpen && (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                          <PaymentsModal
                            variant="inline"
                            isOpen={paymentsOpen}
                            onClose={() => setPaymentsOpen(false)}
                          />
                        </div>
                      )}
                      {!showPermissionModal &&
                        userLocation &&
                        !locationPickerActive &&
                        !paymentsOpen &&
                        !serviceModalOpen && (
                        <div className="flex w-full shrink-0 flex-col overflow-y-auto">
                          <HomeDashboard
                            onRequestImmediateSupport={() => {
                              setPaymentsOpen(false)
                              setServiceModalOpen(true)
                            }}
                            onOpenPayments={() => {
                              setServiceModalOpen(false)
                              setPaymentsOpen(true)
                            }}
                            onOpenLocationSettings={openLocationFromDashboard}
                            phoneDisplay={DISPATCH_PHONE_DISPLAY}
                            phoneE164={DISPATCH_PHONE_E164}
                          />
                        </div>
                      )}
                      {!showPermissionModal &&
                        userLocation &&
                        !locationPickerActive &&
                        !paymentsOpen &&
                        serviceModalOpen && (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                          <FloatingMenu
                            userLocation={userLocation}
                            addressLabel={locationDisplayLabel}
                            locationPending={serviceLocationPending}
                            isModalOpen
                            onClose={() => setServiceModalOpen(false)}
                            onEditLocation={openLocationFromServiceFlow}
                            variant="inline"
                          />
                        </div>
                      )}
                    </MapBottomSheet>
                  </div>
                </div>
              </>
            ) : (
              <div className="box-border flex min-h-0 flex-1 flex-col px-3 pb-0 sm:px-4">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
                  <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white/70">
                    <div className="animate-pulse-subtle px-4 text-center text-lg text-zinc-900">
                      {isRequestingLocation ? "Getting your location..." : locationError || "Waiting for location..."}
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-100/90 p-3 text-sm text-zinc-600">
                    Location will appear on the map when ready.
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        <aside className="hidden lg:block lg:flex-1" aria-hidden />
      </div>
    </div>
  )
}
