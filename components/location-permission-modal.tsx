"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, AlertCircle } from "lucide-react"

interface LocationPermissionModalProps {
  isOpen: boolean
  onAccept: () => void
  onDeny: () => void
}

export function LocationPermissionModal({ isOpen, onAccept, onDeny }: LocationPermissionModalProps) {
  const [isRequesting, setIsRequesting] = useState(false)

  if (!isOpen) return null

  const handleAccept = () => {
    setIsRequesting(true)
    onAccept()
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-foreground" />
            <span className="text-base font-semibold text-foreground">Location Access</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Allow Location Access?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We need your location to provide accurate locksmith services and dispatch a technician to your exact location.
            </p>
          </div>

          <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-xs text-muted-foreground">
                Faster service dispatch to your exact location
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-xs text-muted-foreground">
                Accurate arrival time estimates
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-xs text-muted-foreground">
                Your location is only used for service requests
              </p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                If you deny access, you can still use our service by manually entering your address.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={onDeny}
            disabled={isRequesting}
            className="flex-1 h-11 sm:h-12"
          >
            Deny
          </Button>
          <Button
            size="lg"
            onClick={handleAccept}
            disabled={isRequesting}
            className="flex-1 bg-foreground text-background hover:bg-foreground/90 h-11 sm:h-12"
          >
            {isRequesting ? "Requesting..." : "Allow Location"}
          </Button>
        </div>
      </div>
    </div>
  )
}

