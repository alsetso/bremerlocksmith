import type { MapView } from "@/lib/map-view"

export type MapChromeFlagsInput = {
  mapView: MapView | null
  showPermissionModal: boolean
  rightDrawerOpen: boolean
  serviceModalOpen: boolean
  paymentsOpen: boolean
  hasUserLocation: boolean
  locationPickerActive: boolean
}

/**
 * Single place for “when is this chrome visible?” — keeps home page JSX readable
 * and avoids drift between floating bar, left rail, bottom sheet, and modal slots.
 */
export function getMapChromeFlags(i: MapChromeFlagsInput) {
  const modalBlocking =
    i.showPermissionModal || i.rightDrawerOpen || i.serviceModalOpen || i.paymentsOpen

  return {
    /** Icon pill + panel (mobile only in component). */
    floatingNavEnabled: !i.mapView && !modalBlocking,

    /** Desktop quick-actions column beside map. */
    showLeftQuickRail: !i.mapView && !i.showPermissionModal,

    /** Bottom sheet uses `lg:hidden` when rail replaces it. */
    bottomSheetHideOnLg: !i.mapView && !i.showPermissionModal,

    showPaymentsModal:
      !i.showPermissionModal && i.hasUserLocation && !i.locationPickerActive && i.paymentsOpen,

    showServiceModal:
      !i.showPermissionModal && i.hasUserLocation && !i.locationPickerActive && i.serviceModalOpen,
  }
}
