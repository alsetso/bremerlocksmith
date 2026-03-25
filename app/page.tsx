"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { FloatingMenu } from "@/components/floating-menu"
import { MapComponent } from "@/components/map-component"
import { LocationPermissionModal } from "@/components/location-permission-modal"
import { HomeDashboard } from "@/components/home-dashboard"
import { PaymentsModal } from "@/components/payments-modal"
import { MapBottomSheet } from "@/components/map-bottom-sheet"
import { MapToaster } from "@/components/map-toaster"
import { DashboardQuickActions } from "@/components/dashboard-quick-actions"
import { MapPageOverlay } from "@/components/map-page-overlay"
import { MapOverlayDialog } from "@/components/map-overlay-dialog"
import { FloatingMobileQuickNav } from "@/components/floating-mobile-quick-nav"
import { parseMapView } from "@/lib/map-view"
import { getMapChromeFlags } from "@/lib/map-chrome-flags"
import { DISPATCH_PHONE_DISPLAY, DISPATCH_PHONE_E164 } from "@/lib/dispatch-contact"
import { useHomeQuickActionHandlers } from "@/hooks/use-home-quick-action-handlers"
import { toast } from "sonner"
import { reverseGeocodeMeetingLine } from "@/lib/reverse-geocode"
import { readStoredServiceLocation, writeStoredServiceLocation } from "@/lib/service-location-storage"
import { HomeHeroSection } from "@/components/home-hero-section"
import { HomeDemoWorkflowSection } from "@/components/home-demo-workflow-section"

/** Fallback map center while the location modal is open (Minneapolis, MN). */
const DEFAULT_MAP_CENTER: [number, number] = [44.9778, -93.265]

/** Browser / emulator default that is not a real customer position. */
const FAKE_GEO_LOC: [number, number] = [53.0793, 8.8017]

const DEVICE_LIVE_TRACKING_STORAGE_KEY = "bremer-device-live-tracking"

function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mapView = parseMapView(searchParams.get("view"))

  const closeMapView = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString())
    p.delete("view")
    const s = p.toString()
    router.replace(s ? `/map?${s}` : "/map", { scroll: false })
  }, [router, searchParams])

  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_MAP_CENTER)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [paymentsOpen, setPaymentsOpen] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false)
  /** When the user picks an address (typed, suggestion, or map pin), show that under the logo and in the service flow. */
  const [locationDisplayLabel, setLocationDisplayLabel] = useState<string | null>(null)
  /** User skipped location in the permission step — show service flow with “Select service location” until they share a real location. */
  const [serviceLocationPending, setServiceLocationPending] = useState(true)
  /** Purple pin on the main map during the location modal (lat, lng). */
  const [pickerPin, setPickerPin] = useState<[number, number] | null>(null)
  /** After changing location from the service request flow, reopen that flow. */
  const [resumeServiceAfterLocation, setResumeServiceAfterLocation] = useState(false)
  /** User chose live GPS (Find me) vs a saved typed address. */
  const [liveLocationMode, setLiveLocationMode] = useState(false)
  /** Bumps when user enables live location so the map geolocate control runs. */
  const [findMeTriggerNonce, setFindMeTriggerNonce] = useState(0)
  /** Bottom sheet over the map: always leaves a peek bar; expands/collapses (never fully dismissed). */
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(true)
  /** Right nav drawer (hamburger): quick actions + account; hidden until opened. */
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)
  /** Continuous device position when meeting point is fixed (or pending) — independent of the blue meeting pin. */
  const [deviceLiveTracking, setDeviceLiveTracking] = useState(false)
  const [deviceLivePosition, setDeviceLivePosition] = useState<[number, number] | null>(null)

  /** Avoid applying an older reverse-geocode result if the user picks again quickly. */
  const mapLabelSeqRef = useRef(0)

  const locationPickerActive = showPermissionModal
  const mapCenter = userLocation
  /** Meeting coords follow Mapbox live GPS (no separate green “movement” pin). */
  const liveMeetingLockedToGps =
    liveLocationMode && !serviceLocationPending && !locationDisplayLabel?.trim()

  const trackedDevicePinForMap = useMemo(() => {
    if (!deviceLiveTracking || !deviceLivePosition) return null
    if (liveMeetingLockedToGps) return null
    if (liveLocationMode && serviceLocationPending) return null
    return deviceLivePosition
  }, [
    deviceLiveTracking,
    deviceLivePosition,
    liveMeetingLockedToGps,
    liveLocationMode,
    serviceLocationPending,
  ])

  const liveDeviceCoordsLine = useMemo(() => {
    if (!deviceLivePosition) return null
    const [lat, lng] = deviceLivePosition
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }, [deviceLivePosition])

  const mapChrome = useMemo(
    () =>
      getMapChromeFlags({
        mapView,
        showPermissionModal,
        rightDrawerOpen,
        serviceModalOpen,
        paymentsOpen,
        hasUserLocation: true,
        locationPickerActive,
      }),
    [
      mapView,
      showPermissionModal,
      rightDrawerOpen,
      serviceModalOpen,
      paymentsOpen,
      locationPickerActive,
    ],
  )

  /** Matches nav/header intent: typed label, else live GPS without a label. */
  const quickActionsLocationSummary = useMemo(() => {
    if (serviceLocationPending) return null
    const trimmed = locationDisplayLabel?.trim() || null
    if (trimmed) return trimmed
    if (liveLocationMode && userLocation) return "Live location"
    return null
  }, [serviceLocationPending, locationDisplayLabel, userLocation, liveLocationMode])

  const requestUserLocation = (opts?: { bootstrapMeeting?: boolean }) => {
    const bootstrapMeeting = opts?.bootstrapMeeting ?? false
    setLocationError(null)

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          if (lat === FAKE_GEO_LOC[0] && lng === FAKE_GEO_LOC[1]) {
            setLocationError("Unable to verify your location. Using default location.")
            setUserLocation([44.9778, -93.265])
            if (bootstrapMeeting) {
              setLiveLocationMode(false)
              setServiceLocationPending(true)
            }
          } else {
            setUserLocation([lat, lng])
            localStorage.setItem("location-permission-status", "granted")
            if (bootstrapMeeting) {
              setLiveLocationMode(true)
              setServiceLocationPending(false)
              setLocationDisplayLabel(null)
              setLocationError(null)
            }
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError("Unable to get your location. Using default location.")
          setUserLocation([44.9778, -93.265])
          localStorage.setItem("location-permission-status", "denied")
          if (bootstrapMeeting) {
            setLiveLocationMode(false)
            setServiceLocationPending(true)
          }
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
    }
  }

  useEffect(() => {
    if (showPermissionModal) setPickerPin(null)
  }, [showPermissionModal])

  /** Location / service / payments use overlay modals — keep map bottom sheet collapsed while they’re open. */
  useEffect(() => {
    if (showPermissionModal || serviceModalOpen || paymentsOpen) {
      setBottomSheetExpanded(false)
    }
  }, [showPermissionModal, serviceModalOpen, paymentsOpen])

  /** Full-screen map “pages” (query `view`) take focus: collapse sheet & drawer. */
  useEffect(() => {
    if (!mapView) return
    setBottomSheetExpanded(false)
    setRightDrawerOpen(false)
  }, [mapView])

  useEffect(() => {
    if (userLocation) setPickerPin(null)
  }, [userLocation])

  /** Persist meeting-point snapshot whenever service location state changes (single source for reloads). */
  useEffect(() => {
    if (typeof window === "undefined") return
    const lat = userLocation[0]
    const lng = userLocation[1]
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
    const stored = readStoredServiceLocation()
    if (stored) {
      setUserLocation([stored.lat, stored.lng])
      setLiveLocationMode(stored.live)
      setLocationDisplayLabel(stored.label)
      setServiceLocationPending(stored.servicePending)
    } else {
      setLiveLocationMode(false)
      setLocationDisplayLabel(null)
      setServiceLocationPending(true)
    }
    setShowPermissionModal(false)

    if (typeof window !== "undefined" && localStorage.getItem(DEVICE_LIVE_TRACKING_STORAGE_KEY) === "1") {
      setDeviceLiveTracking(true)
    }

    const permissionStatus = localStorage.getItem("location-permission-status")
    if (permissionStatus === "granted" && (!stored || stored.live)) {
      requestUserLocation({ bootstrapMeeting: !stored })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!deviceLiveTracking) {
      setDeviceLivePosition(null)
      return
    }
    if (liveMeetingLockedToGps) {
      setDeviceLivePosition(null)
      return
    }
    if (liveLocationMode && serviceLocationPending) {
      setDeviceLivePosition(null)
      return
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setDeviceLivePosition([pos.coords.latitude, pos.coords.longitude])
        try {
          localStorage.setItem("location-permission-status", "granted")
        } catch {
          /* ignore */
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [deviceLiveTracking, liveMeetingLockedToGps, liveLocationMode, serviceLocationPending])

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

  const openLocationFromDashboard = useCallback(() => {
    setResumeServiceAfterLocation(false)
    setShowPermissionModal(true)
  }, [])

  const persistDeviceLiveTracking = useCallback((on: boolean) => {
    setDeviceLiveTracking(on)
    try {
      localStorage.setItem(DEVICE_LIVE_TRACKING_STORAGE_KEY, on ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [])

  /** One tap to support: try a GPS fix for meeting point when still pending, then open the flow. */
  const openServiceRequest = useCallback(() => {
    setPaymentsOpen(false)
    if (!serviceLocationPending) {
      setServiceModalOpen(true)
      return
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setServiceModalOpen(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        if (lat === FAKE_GEO_LOC[0] && lng === FAKE_GEO_LOC[1]) {
          setLocationError("Unable to verify your location. Using default location.")
          setUserLocation([44.9778, -93.265])
          setServiceModalOpen(true)
          return
        }
        setUserLocation([lat, lng])
        setLiveLocationMode(true)
        setServiceLocationPending(false)
        setLocationDisplayLabel(null)
        setLocationError(null)
        localStorage.setItem("location-permission-status", "granted")
        setFindMeTriggerNonce((n) => n + 1)
        setServiceModalOpen(true)
      },
      () => {
        setServiceModalOpen(true)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }, [serviceLocationPending])

  const quickHandlers = useHomeQuickActionHandlers({
    setRightDrawerOpen,
    setServiceModalOpen,
    openServiceRequest,
    setPaymentsOpen,
    setBottomSheetExpanded,
    openLocationPanel: openLocationFromDashboard,
  })

  const openLocationFromServiceFlow = () => {
    setResumeServiceAfterLocation(true)
    setServiceModalOpen(false)
    setShowPermissionModal(true)
  }

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-black">
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Navigation
            userLocation={userLocation}
            locationDisplayLabel={
              serviceLocationPending ? "Select service location" : locationDisplayLabel
            }
            frameClassName="max-w-none"
            drawerOpen={rightDrawerOpen}
            onDrawerOpenChange={setRightDrawerOpen}
            drawerQuickActions={
              <div className="lg:hidden">
                <DashboardQuickActions
                  variant="list"
                  locationSummary={quickActionsLocationSummary}
                  locationPending={serviceLocationPending}
                  {...quickHandlers.drawer}
                  phoneE164={DISPATCH_PHONE_E164}
                />
              </div>
            }
          />
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <>
                <FloatingMobileQuickNav
                  enabled={mapChrome.floatingNavEnabled}
                  {...quickHandlers.map}
                  phoneE164={DISPATCH_PHONE_E164}
                  phoneDisplay={DISPATCH_PHONE_DISPLAY}
                  onClosePanelDismiss={quickHandlers.onFloatingPanelDismiss}
                />
                <div className="box-border flex min-h-0 flex-1 flex-col px-3 pb-0 sm:px-4 lg:flex-row lg:gap-0 lg:px-4">
                  {/* Large screens: quick actions in a left rail beside the map */}
                  <aside
                    className={`mb-3 hidden min-h-0 w-[12rem] shrink-0 flex-col gap-2 rounded-2xl border border-zinc-700/90 bg-zinc-950/75 px-2.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:mb-0 lg:mr-3 lg:self-stretch ${
                      mapChrome.showLeftQuickRail ? "lg:flex" : "lg:hidden"
                    }`}
                    aria-label="Quick actions"
                  >
                    <p className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                      Quick actions
                    </p>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <DashboardQuickActions
                        variant="list"
                        locationSummary={quickActionsLocationSummary}
                        locationPending={serviceLocationPending}
                        {...quickHandlers.map}
                        phoneE164={DISPATCH_PHONE_E164}
                      />
                    </div>
                  </aside>
                  <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
                    {mapView && <MapPageOverlay view={mapView} onClose={closeMapView} />}
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
                        showFindMeControl
                        findMeTriggerNonce={findMeTriggerNonce}
                        onGeolocateSuccess={handleGeolocateSuccess}
                        onGeolocateFallback={handleGeolocateFallback}
                        liveGpsPrimary={liveLocationMode && !locationPickerActive}
                        trackedDevicePin={trackedDevicePinForMap}
                      />
                    </div>
                    <MapBottomSheet
                      className={mapChrome.bottomSheetHideOnLg ? "lg:hidden" : undefined}
                      lockExpanded={false}
                      expanded={bottomSheetExpanded}
                      onExpandedChange={setBottomSheetExpanded}
                      title="Dashboard"
                    >
                      {!showPermissionModal && !paymentsOpen && !serviceModalOpen && (
                        <div className="flex w-full shrink-0 flex-col overflow-y-auto">
                          <HomeDashboard
                            locationSummary={quickActionsLocationSummary}
                            locationPending={serviceLocationPending}
                            {...quickHandlers.map}
                            phoneDisplay={DISPATCH_PHONE_DISPLAY}
                            phoneE164={DISPATCH_PHONE_E164}
                          />
                        </div>
                      )}
                    </MapBottomSheet>

                    {showPermissionModal && (
                      <MapOverlayDialog
                        title="Location"
                        titleId="location-overlay-title"
                        onClose={() => dismissLocationPanelWithResume()}
                      >
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
                      </MapOverlayDialog>
                    )}

                    {mapChrome.showPaymentsModal && (
                      <PaymentsModal isOpen={paymentsOpen} onClose={() => setPaymentsOpen(false)} />
                    )}

                    {mapChrome.showServiceModal && (
                      <FloatingMenu
                        userLocation={userLocation}
                        addressLabel={locationDisplayLabel}
                        locationPending={serviceLocationPending}
                        liveMeetingLockedToGps={liveMeetingLockedToGps}
                        deviceLiveTracking={deviceLiveTracking}
                        onDeviceLiveTrackingChange={persistDeviceLiveTracking}
                        liveDeviceCoordsLine={liveDeviceCoordsLine}
                        isModalOpen
                        onClose={() => setServiceModalOpen(false)}
                        onEditLocation={openLocationFromServiceFlow}
                        variant="overlay"
                      />
                    )}
                  </div>
                </div>
            </>
          </main>
        </div>
      </div>
    </div>
  )
}

export function MapHomePage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] w-screen overflow-hidden bg-black" aria-busy="true" aria-label="Loading" />
      }
    >
      <HomePageContent />
    </Suspense>
  )
}

export default function HomePage() {
  return (
    <div data-app-scroll-root className="h-[100dvh] overflow-y-auto bg-zinc-950 text-zinc-100">
      <Navigation frameClassName="max-w-none" />
      <main className="w-full pb-12 pt-0">
        <HomeHeroSection />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <HomeDemoWorkflowSection />
          <p className="mt-6 text-sm text-zinc-500">
            Need immediate assistance?{" "}
            <Link href="/map" className="text-sky-400/90 underline-offset-4 hover:underline">
              Open the live map and request support.
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
