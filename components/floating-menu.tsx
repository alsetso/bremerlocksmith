"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ServiceRequestModal } from "@/components/service-request-modal"

interface FloatingMenuProps {
  userLocation?: [number, number] | null
}


export function FloatingMenu({ userLocation }: FloatingMenuProps) {
  const [userAddress, setUserAddress] = useState<string>("Getting address...")
  const [coordinates, setCoordinates] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  useEffect(() => {
    if (userLocation) {
      const [lat, lng] = userLocation
      setCoordinates(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      
      // Use Mapbox for detailed reverse geocoding
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      
      if (mapboxToken) {
        // Mapbox reverse geocoding for full street address
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,poi`)
          .then(response => response.json())
          .then(data => {
            if (data.features && data.features.length > 0) {
              const feature = data.features[0]
              const address = feature.place_name || feature.properties?.address || "Location detected"
              setUserAddress(address)
            } else {
              // Fallback to BigDataCloud if Mapbox fails
              fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
                .then(response => response.json())
                .then(data => {
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
            // Fallback to BigDataCloud if Mapbox fails
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
              .then(response => response.json())
              .then(data => {
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
        // Fallback to BigDataCloud if no Mapbox token
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
          .then(response => response.json())
          .then(data => {
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
    }
  }, [userLocation])

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      {/* Get Service Button */}
      <div className="get-service-button animate-slide-up">
        <Button
          size="lg"
          onClick={() => setIsModalOpen(true)}
          className={`bg-red-600 text-white hover:bg-red-700 transition-all duration-200 hover:scale-105 shadow-lg border-2 border-red-800 px-8 py-4 text-lg font-semibold rounded-xl focus-visible:ring-red-400 ${
            isModalOpen ? "ring-2 ring-red-300 ring-offset-2 ring-offset-background" : ""
          }`}
        >
          Get Service
        </Button>
      </div>

      {/* Service Request Modal */}
      {userLocation && (
        <ServiceRequestModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          userLocation={userLocation}
          userAddress={userAddress}
          coordinates={coordinates}
        />
      )}
    </>
  )
}
