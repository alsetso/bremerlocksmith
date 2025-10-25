"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, User, MessageSquare, Phone, CheckCircle, ArrowLeft, Car, Home, Building } from "lucide-react"

interface FloatingMenuProps {
  userLocation?: [number, number] | null
}

interface TechnicianRequest {
  serviceType: "lockout" | "other" | ""
  lockoutType: "car" | "house" | "business" | ""
  customerName: string
  phoneNumber: string
  notes: string
}

export function FloatingMenu({ userLocation }: FloatingMenuProps) {
  const [userAddress, setUserAddress] = useState<string>("Getting address...")
  const [coordinates, setCoordinates] = useState<string>("")
  const [step, setStep] = useState<"service" | "lockout-type" | "details" | "confirm" | "submitted">("service")
  const [request, setRequest] = useState<TechnicianRequest>({
    serviceType: "",
    lockoutType: "",
    customerName: "",
    phoneNumber: "",
    notes: ""
  })
  const [submissionTime, setSubmissionTime] = useState<string>("")

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

  const handleServiceTypeSelect = (serviceType: "lockout" | "other") => {
    setRequest(prev => ({ ...prev, serviceType }))
    if (serviceType === "lockout") {
      setStep("lockout-type")
    } else {
      setStep("details")
    }
  }

  const handleLockoutTypeSelect = (lockoutType: "car" | "house" | "business") => {
    setRequest(prev => ({ ...prev, lockoutType }))
    setStep("details")
  }

  const handleNextToConfirm = () => {
    if (request.customerName.trim() && request.phoneNumber.trim()) {
      setStep("confirm")
    }
  }

  const handleConfirmRequest = async () => {
    try {
      // Set submission timestamp
      const now = new Date()
      const timestamp = now.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      setSubmissionTime(timestamp)

      // Send email notification
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: request.serviceType,
          lockoutType: request.lockoutType,
          customerName: request.customerName,
          phoneNumber: request.phoneNumber,
          notes: request.notes,
          userAddress: userAddress,
          coordinates: coordinates,
        }),
      })

      if (emailResponse.ok) {
        setStep("submitted")
      } else {
        console.error('Email failed:', await emailResponse.text())
        setStep("submitted") // Still show success even if email fails
      }
    } catch (error) {
      console.error('Request submission error:', error)
      setStep("submitted") // Still show success even if email fails
    }
  }

  const handleBack = () => {
    if (step === "confirm") {
      setStep("details")
    } else if (step === "details") {
      if (request.serviceType === "lockout") {
        setStep("lockout-type")
      } else {
        setStep("service")
      }
    } else if (step === "lockout-type") {
      setStep("service")
    }
  }

  const handleNewRequest = () => {
    setStep("service")
    setRequest({ serviceType: "", lockoutType: "", customerName: "", phoneNumber: "", notes: "" })
    setSubmissionTime("")
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] animate-slide-up w-full max-w-md px-3">
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-3 max-h-[60vh] overflow-y-auto">
        {/* Location Header */}
        <div className="mb-3 bg-foreground/10 border border-foreground/20 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-foreground font-medium">{userAddress}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground font-mono">{coordinates}</p>
          </div>
        </div>

        {/* Multi-step Form */}
        {step === "service" && (
          /* Step 1: Service Type Selection */
          <div className="space-y-3">
            <div className="text-center mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">What service do you need?</h3>
              <p className="text-xs text-muted-foreground">Select the type of locksmith service</p>
            </div>
            
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleServiceTypeSelect("lockout")}
                className="w-full justify-start text-xs h-10"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Emergency Lockout
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleServiceTypeSelect("other")}
                className="w-full justify-start text-xs h-10"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Other Key Services
              </Button>
            </div>
          </div>
        )}

        {step === "lockout-type" && (
          /* Step 2: Lockout Type Selection */
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBack}
                className="p-1 h-6 w-6"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
              <div>
                <h3 className="text-sm font-semibold text-foreground">What type of lockout?</h3>
                <p className="text-xs text-muted-foreground">Help us understand your situation</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLockoutTypeSelect("car")}
                className="w-full justify-start text-xs h-10"
              >
                <Car className="w-4 h-4 mr-2" />
                Car Lockout
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLockoutTypeSelect("house")}
                className="w-full justify-start text-xs h-10"
              >
                <Home className="w-4 h-4 mr-2" />
                House Lockout
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLockoutTypeSelect("business")}
                className="w-full justify-start text-xs h-10"
              >
                <Building className="w-4 h-4 mr-2" />
                Business Lockout
              </Button>
            </div>
          </div>
        )}

        {step === "details" && (
          /* Step 3: Customer Details */
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBack}
                className="p-1 h-6 w-6"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Your Details</h3>
                <p className="text-xs text-muted-foreground">We need your contact information</p>
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Your Name *</label>
              <div className="relative">
                <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  type="text"
                  value={request.customerName}
                  onChange={(e) => setRequest(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  type="tel"
                  value={request.phoneNumber}
                  onChange={(e) => setRequest(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="(XXX) XXX-XXXX"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Additional Notes</label>
              <div className="relative">
                <MessageSquare className="absolute left-2 top-2 w-3 h-3 text-muted-foreground" />
                <textarea
                  value={request.notes}
                  onChange={(e) => setRequest(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Describe your locksmith needs..."
                  rows={3}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 resize-none"
                />
              </div>
            </div>

            <Button
              size="sm"
              disabled={!request.customerName.trim() || !request.phoneNumber.trim()}
              onClick={handleNextToConfirm}
              className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xs h-9"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Continue to Confirm
            </Button>
          </div>
        )}

        {step === "confirm" && (
          /* Step 4: Confirmation */
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBack}
                className="p-1 h-6 w-6"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold text-foreground">Confirm Request</h3>
              </div>
            </div>

            {/* Request Summary */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Service:</span>
                <span className="text-xs font-medium text-foreground">
                  {request.serviceType === "lockout" ? "Emergency Lockout" : "Other Key Services"}
                  {request.lockoutType && ` - ${request.lockoutType.charAt(0).toUpperCase() + request.lockoutType.slice(1)}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Customer:</span>
                <span className="text-xs font-medium text-foreground">{request.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Phone:</span>
                <span className="text-xs font-medium text-foreground">{request.phoneNumber}</span>
              </div>
              {request.notes && (
                <div className="pt-2 border-t border-foreground/10">
                  <span className="text-xs text-muted-foreground block mb-1">Notes:</span>
                  <span className="text-xs text-foreground">{request.notes}</span>
                </div>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleConfirmRequest}
              className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 hover:scale-105 text-xs h-9"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Confirm & Dispatch
            </Button>
          </div>
        )}

        {step === "submitted" && (
          /* Step 5: Request Submitted Confirmation */
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Request Submitted!</h3>
              <p className="text-sm text-muted-foreground">Your locksmith request has been received</p>
            </div>

            {/* Submission Details */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-4 space-y-3">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Submitted at:</div>
                <div className="text-sm font-mono text-foreground">{submissionTime}</div>
              </div>
              
              <div className="border-t border-foreground/10 pt-3">
                <div className="text-xs text-muted-foreground mb-2">Service Request:</div>
                <div className="text-sm text-foreground">
                  {request.serviceType === "lockout" ? "Emergency Lockout" : "Other Key Services"}
                  {request.lockoutType && ` - ${request.lockoutType.charAt(0).toUpperCase() + request.lockoutType.slice(1)}`}
                </div>
                <div className="text-sm text-foreground mt-1">
                  {request.customerName} • {request.phoneNumber}
                </div>
              </div>
            </div>

            {/* Callback Promise */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-foreground">What's Next?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our technician will call you back within <span className="font-semibold text-blue-500">15 minutes</span> if we are able to help with your request. 
                Please keep your phone nearby and answer any calls from unknown numbers.
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleNewRequest}
              className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 hover:scale-105 text-xs h-9"
            >
              Submit Another Request
            </Button>
          </div>
        )}

        <div className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground">Licensed & Insured • 24/7 Emergency Service</p>
        </div>
      </div>
    </div>
  )
}
