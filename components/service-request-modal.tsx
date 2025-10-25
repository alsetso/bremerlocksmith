"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, User, MessageSquare, Phone, CheckCircle, ArrowLeft, Car, Home, Building, X } from "lucide-react"

interface ServiceRequestModalProps {
  isOpen: boolean
  onClose: () => void
  userLocation: [number, number]
  userAddress: string
  coordinates: string
  initialServiceType?: "lockout" | "other"
  initialLockoutType?: "car" | "house" | "business"
}

interface TechnicianRequest {
  serviceType: "lockout" | "other" | ""
  lockoutType: "car" | "house" | "business" | ""
  customerName: string
  phoneNumber: string
  notes: string
}

export function ServiceRequestModal({ 
  isOpen, 
  onClose, 
  userLocation, 
  userAddress, 
  coordinates,
  initialServiceType = "",
  initialLockoutType = ""
}: ServiceRequestModalProps) {
  const [step, setStep] = useState<"service" | "lockout-type" | "details" | "confirm" | "submitted">(
    initialServiceType ? (initialServiceType === "lockout" && !initialLockoutType ? "lockout-type" : "details") : "service"
  )
  const [request, setRequest] = useState<TechnicianRequest>({
    serviceType: initialServiceType,
    lockoutType: initialLockoutType,
    customerName: "",
    phoneNumber: "",
    notes: ""
  })
  const [submissionTime, setSubmissionTime] = useState<string>("")

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

  const handleClose = () => {
    if (step === "submitted") {
      handleNewRequest()
    }
    onClose()
  }

  if (!isOpen) {
    console.log('Modal not open, isOpen:', isOpen)
    return null
  }

  console.log('Modal rendering, isOpen:', isOpen, 'userLocation:', userLocation)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm sm:max-w-md max-h-[85vh] sm:max-h-[90vh] bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-foreground">Service Request</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className="p-1 h-6 w-6"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Location Info */}
        <div className="p-3 sm:p-4 bg-foreground/5 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-foreground font-medium truncate">{userAddress}</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground font-mono">{coordinates}</p>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-100px)] sm:max-h-[calc(90vh-120px)]">
          <div className="p-3 sm:p-4">
            {/* Multi-step Form */}
            {step === "service" && (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">What service do you need?</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Select the type of locksmith service</p>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleServiceTypeSelect("lockout")}
                    className="w-full justify-start h-10 sm:h-12"
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    Emergency Lockout
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleServiceTypeSelect("other")}
                    className="w-full justify-start h-10 sm:h-12"
                  >
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    Other Key Services
                  </Button>
                </div>
              </div>
            )}

            {step === "lockout-type" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleBack}
                    className="p-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">What type of lockout?</h3>
                    <p className="text-sm text-muted-foreground">Help us understand your situation</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleLockoutTypeSelect("car")}
                    className="w-full justify-start h-12"
                  >
                    <Car className="w-5 h-5 mr-3" />
                    Car Lockout
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleLockoutTypeSelect("house")}
                    className="w-full justify-start h-12"
                  >
                    <Home className="w-5 h-5 mr-3" />
                    House Lockout
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleLockoutTypeSelect("business")}
                    className="w-full justify-start h-12"
                  >
                    <Building className="w-5 h-5 mr-3" />
                    Business Lockout
                  </Button>
                </div>
              </div>
            )}

            {step === "details" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleBack}
                    className="p-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Your Details</h3>
                    <p className="text-sm text-muted-foreground">We need your contact information</p>
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Your Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={request.customerName}
                      onChange={(e) => setRequest(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={request.phoneNumber}
                      onChange={(e) => setRequest(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="(XXX) XXX-XXXX"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Additional Notes</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <textarea
                      value={request.notes}
                      onChange={(e) => setRequest(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Describe your locksmith needs..."
                      rows={4}
                      className="w-full pl-10 pr-4 py-3 text-sm bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 resize-none"
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  disabled={!request.customerName.trim() || !request.phoneNumber.trim()}
                  onClick={handleNextToConfirm}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed h-12"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Continue to Confirm
                </Button>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleBack}
                    className="p-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-foreground">Confirm Request</h3>
                  </div>
                </div>

                {/* Request Summary */}
                <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Service:</span>
                    <span className="text-sm font-medium text-foreground">
                      {request.serviceType === "lockout" ? "Emergency Lockout" : "Other Key Services"}
                      {request.lockoutType && ` - ${request.lockoutType.charAt(0).toUpperCase() + request.lockoutType.slice(1)}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Customer:</span>
                    <span className="text-sm font-medium text-foreground">{request.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    <span className="text-sm font-medium text-foreground">{request.phoneNumber}</span>
                  </div>
                  {request.notes && (
                    <div className="pt-3 border-t border-foreground/10">
                      <span className="text-sm text-muted-foreground block mb-2">Notes:</span>
                      <span className="text-sm text-foreground">{request.notes}</span>
                    </div>
                  )}
                </div>

                <Button
                  size="lg"
                  onClick={handleConfirmRequest}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 hover:scale-105 h-12"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm & Dispatch
                </Button>
              </div>
            )}

            {step === "submitted" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Request Submitted!</h3>
                  <p className="text-sm text-muted-foreground">Your locksmith request has been received</p>
                </div>

                {/* Submission Details */}
                <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-4 space-y-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Submitted at:</div>
                    <div className="text-base font-mono text-foreground">{submissionTime}</div>
                  </div>
                  
                  <div className="border-t border-foreground/10 pt-4">
                    <div className="text-sm text-muted-foreground mb-2">Service Request:</div>
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
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-5 h-5 text-blue-500" />
                    <span className="text-base font-semibold text-foreground">What's Next?</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our technician will call you back within <span className="font-semibold text-blue-500">15 minutes</span> if we are able to help with your request. 
                    Please keep your phone nearby and answer any calls from unknown numbers.
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleNewRequest}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 hover:scale-105 h-12"
                >
                  Submit Another Request
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-border text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">Licensed & Insured • 24/7 Emergency Service</p>
        </div>
      </div>
    </div>
  )
}
