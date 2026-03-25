"use client"

import { useCallback, useMemo } from "react"

type SetBool = React.Dispatch<React.SetStateAction<boolean>>

/**
 * One implementation for “open support / payments / location” used from drawer, rail,
 * bottom sheet, and floating mobile bar — only the drawer variant closes the hamburger first.
 */
export function useHomeQuickActionHandlers({
  setRightDrawerOpen,
  setServiceModalOpen,
  openServiceRequest,
  setPaymentsOpen,
  setBottomSheetExpanded,
  openLocationPanel,
}: {
  setRightDrawerOpen: SetBool
  setServiceModalOpen: SetBool
  /** Prime GPS when meeting point is still pending, then open the structured request flow. */
  openServiceRequest: () => void
  setPaymentsOpen: SetBool
  setBottomSheetExpanded: SetBool
  openLocationPanel: () => void
}) {
  const openImmediateSupport = useCallback(
    (opts?: { closeDrawer?: boolean }) => {
      if (opts?.closeDrawer) setRightDrawerOpen(false)
      setPaymentsOpen(false)
      openServiceRequest()
    },
    [setRightDrawerOpen, setPaymentsOpen, openServiceRequest],
  )

  const openPayments = useCallback(
    (opts?: { closeDrawer?: boolean }) => {
      if (opts?.closeDrawer) setRightDrawerOpen(false)
      setServiceModalOpen(false)
      setPaymentsOpen(true)
    },
    [setRightDrawerOpen, setServiceModalOpen, setPaymentsOpen],
  )

  const openLocationSettings = useCallback(
    (opts?: { closeDrawer?: boolean }) => {
      if (opts?.closeDrawer) setRightDrawerOpen(false)
      openLocationPanel()
    },
    [setRightDrawerOpen, openLocationPanel],
  )

  const onFloatingPanelDismiss = useCallback(() => {
    setBottomSheetExpanded(true)
    setPaymentsOpen(false)
    setServiceModalOpen(false)
  }, [setBottomSheetExpanded, setPaymentsOpen, setServiceModalOpen])

  return useMemo(
    () => ({
      drawer: {
        onRequestImmediateSupport: () => openImmediateSupport({ closeDrawer: true }),
        onOpenPayments: () => openPayments({ closeDrawer: true }),
        onOpenLocationSettings: () => openLocationSettings({ closeDrawer: true }),
      },
      map: {
        onRequestImmediateSupport: () => openImmediateSupport(),
        onOpenPayments: () => openPayments(),
        onOpenLocationSettings: openLocationPanel,
      },
      onFloatingPanelDismiss,
    }),
    [openImmediateSupport, openPayments, openLocationSettings, openLocationPanel, onFloatingPanelDismiss],
  )
}
