"use client"

import { useState, useEffect } from "react"
import { ServiceRequestModal } from "@/components/service-request-modal"

interface FloatingMenuProps {
  userLocation?: [number, number] | null
  /** User-confirmed place name from search / map (shown instead of reverse-geocoding coords). */
  addressLabel?: string | null
  /** User chose “Not Now” on location — no real service address yet. */
  locationPending?: boolean
  isModalOpen: boolean
  onClose: () => void
  /** Opens the select / live GPS location form (below the map). */
  onEditLocation?: () => void
  variant?: "overlay" | "inline"
}

export function FloatingMenu({
  userLocation,
  addressLabel,
  locationPending = false,
  isModalOpen,
  onClose,
  onEditLocation,
  variant = "overlay",
}: FloatingMenuProps) {
  const [userAddress, setUserAddress] = useState<string>("Getting address...")
  const [coordinates, setCoordinates] = useState<string>("")

  useEffect(() => {
    if (!userLocation) {
      return
    }

    const [lat, lng] = userLocation
    const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`

    if (locationPending) {
      setUserAddress("Select service location")
      setCoordinates("")
      return
    }

    const label = addressLabel?.trim()
    if (label) {
      setUserAddress(label)
      setCoordinates(coordStr)
      return
    }

    setCoordinates(coordStr)

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (mapboxToken) {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,poi`)
        .then((response) => response.json())
        .then((data) => {
          if (data.features && data.features.length > 0) {
            const feature = data.features[0]
            const address = feature.place_name || feature.properties?.address || "Location detected"
            setUserAddress(address)
          } else {
            fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
            )
              .then((response) => response.json())
              .then((data) => {
                if (data.locality && data.principalSubdivision) {
                  setUserAddress(`${data.locality}, ${data.principalSubdivision}`)
                } else {
                  setUserAddress("Location detected")
                }
              })
              .catch(() => {
                setUserAddress("Location detected")
              })
          }
        })
        .catch(() => {
          fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.locality && data.principalSubdivision) {
                setUserAddress(`${data.locality}, ${data.principalSubdivision}`)
              } else {
                setUserAddress("Location detected")
              }
            })
            .catch(() => {
              setUserAddress("Location detected")
            })
        })
    } else {
      fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.locality && data.principalSubdivision) {
            setUserAddress(`${data.locality}, ${data.principalSubdivision}`)
          } else {
            setUserAddress("Location detected")
          }
        })
        .catch(() => {
          setUserAddress("Location detected")
        })
    }
  }, [userLocation, locationPending, addressLabel])

  if (!userLocation) {
    return null
  }

  return (
    <ServiceRequestModal
      variant={variant}
      isOpen={isModalOpen}
      onClose={onClose}
      userLocation={userLocation}
      userAddress={userAddress}
      coordinates={coordinates}
      locationPending={locationPending}
      addressLabel={addressLabel}
      onEditLocation={onEditLocation}
    />
  )
}
