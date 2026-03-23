"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Navigation,
  User,
  MessageSquare,
  Phone,
  CheckCircle,
  ArrowLeft,
  Car,
  Home,
  Building,
  X,
  Truck,
  Mountain,
  KeyRound,
  Wrench,
} from "lucide-react"

interface ServiceRequestModalProps {
  isOpen: boolean
  onClose: () => void
  userLocation: [number, number]
  userAddress: string
  coordinates: string
  initialServiceType?: "lockout" | "other" | "towing" | "ditch_recovery"
  initialLockoutType?: "car" | "house" | "business"
}

interface TechnicianRequest {
  serviceType: "lockout" | "other" | "towing" | "ditch_recovery" | ""
  lockoutType: "car" | "house" | "business" | ""
  customerName: string
  phoneNumber: string
  notes: string
}

const shellBorder = "border-[#c9b8a3]"
const paper = "bg-[#faf7f2]"
const cream = "bg-[#fffef9]"
const ink = "text-[#3e2723]"
const muted = "text-[#5d4037]/90"
const btnOutline =
  "w-full justify-start border-[#c9b8a3] bg-[#fffef9] text-[#3e2723] hover:bg-[#f5efe6] hover:text-[#2d1f1c] hover:border-[#bdae9c] h-10 sm:h-12 font-medium shadow-sm"
const inputClass =
  "w-full rounded-sm border border-[#c9b8a3] bg-[#fffef9] py-3 text-sm text-[#3e2723] placeholder:text-[#8d7b68]/80 focus:border-[#8d7b68] focus:outline-none focus:ring-2 focus:ring-[#8d7b68]/25"
const btnPrimary =
  "w-full border border-[#4a342c] bg-[#5D4037] text-[#faf7f2] hover:bg-[#4a342c] h-12 font-semibold shadow-sm disabled:opacity-45"

export function ServiceRequestModal({
  isOpen,
  onClose,
  userLocation,
  userAddress,
  coordinates,
  initialServiceType,
  initialLockoutType,
}: ServiceRequestModalProps) {
  const [step, setStep] = useState<"service" | "lockout-type" | "details" | "confirm" | "submitted">(
    initialServiceType ? (initialServiceType === "lockout" && !initialLockoutType ? "lockout-type" : "details") : "service",
  )
  const [request, setRequest] = useState<TechnicianRequest>({
    serviceType: initialServiceType ?? "",
    lockoutType: initialLockoutType ?? "",
    customerName: "",
    phoneNumber: "",
    notes: "",
  })
  const [submissionTime, setSubmissionTime] = useState<string>("")

  const serviceSummaryLabel = (r: TechnicianRequest) => {
    if (r.serviceType === "lockout") {
      return `Emergency Lockout${r.lockoutType ? ` - ${r.lockoutType.charAt(0).toUpperCase()}${r.lockoutType.slice(1)}` : ""}`
    }
    if (r.serviceType === "towing") return "Towing"
    if (r.serviceType === "ditch_recovery") return "Ditch Recovery"
    return "Other Key Services"
  }

  const handleServiceTypeSelect = (serviceType: "lockout" | "other" | "towing" | "ditch_recovery") => {
    setRequest((prev) => ({
      ...prev,
      serviceType,
      lockoutType: serviceType === "lockout" ? prev.lockoutType : "",
    }))
    if (serviceType === "lockout") {
      setStep("lockout-type")
    } else {
      setStep("details")
    }
  }

  const handleLockoutTypeSelect = (lockoutType: "car" | "house" | "business") => {
    setRequest((prev) => ({ ...prev, lockoutType }))
    setStep("details")
  }

  const handleNextToConfirm = () => {
    if (request.customerName.trim() && request.phoneNumber.trim()) {
      setStep("confirm")
    }
  }

  const handleConfirmRequest = async () => {
    try {
      const now = new Date()
      const timestamp = now.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      setSubmissionTime(timestamp)

      const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        console.error("Email failed:", await emailResponse.text())
        setStep("submitted")
      }
    } catch (error) {
      console.error("Request submission error:", error)
      setStep("submitted")
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
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-[#3e2723]/45 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden
      />

      <div
        className={`relative max-h-[85vh] w-full max-w-sm overflow-hidden rounded-sm border ${shellBorder} shadow-[0_8px_40px_rgba(62,39,35,0.18)] sm:max-h-[90vh] sm:max-w-md ${paper}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
      >
        <div className={`flex items-center justify-between border-b ${shellBorder} px-3 py-3 sm:px-4`}>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a34e3d]/40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8b4a3c]" />
            </span>
            <span id="service-modal-title" className={`font-serif text-sm font-semibold ${ink}`}>
              Service request
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className="h-8 w-8 p-0 text-[#4a342c] hover:bg-[#efe8dd]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className={`border-b ${shellBorder} bg-[#efe8dd] px-3 py-3 sm:px-4`}>
          <div className="mb-1 flex items-center gap-2">
            <span className={`truncate text-xs font-medium ${ink}`}>{userAddress}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Navigation className="h-3 w-3 shrink-0 text-[#6d4c41]" aria-hidden />
            <p className="font-mono text-[10px] text-[#5d4037]/85">{coordinates}</p>
          </div>
        </div>

        <div className="max-h-[calc(85vh-100px)] overflow-y-auto sm:max-h-[calc(90vh-120px)]">
          <div className="p-3 sm:p-4">
            {step === "service" && (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center">
                  <h3 className={`mb-1 font-serif text-base font-semibold sm:mb-2 sm:text-lg ${ink}`}>
                    What service do you need?
                  </h3>
                  <p className={`text-xs sm:text-sm ${muted}`}>Select the type of service</p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Button size="lg" variant="outline" onClick={() => handleServiceTypeSelect("lockout")} className={btnOutline}>
                    <KeyRound className="mr-3 h-5 w-5 shrink-0 text-[#5D4037]" strokeWidth={1.65} />
                    Emergency Lockout
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleServiceTypeSelect("towing")} className={btnOutline}>
                    <Truck className="mr-3 h-5 w-5 shrink-0 text-[#5D4037]" strokeWidth={1.65} />
                    Towing
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleServiceTypeSelect("ditch_recovery")} className={btnOutline}>
                    <Mountain className="mr-3 h-5 w-5 shrink-0 text-[#5D4037]" strokeWidth={1.65} />
                    Ditch Recovery
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleServiceTypeSelect("other")} className={btnOutline}>
                    <Wrench className="mr-3 h-5 w-5 shrink-0 text-[#5D4037]" strokeWidth={1.65} />
                    Other Key Services
                  </Button>
                </div>
              </div>
            )}

            {step === "lockout-type" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="ghost" onClick={handleBack} className="p-2 text-[#4a342c] hover:bg-[#efe8dd]">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className={`font-serif text-lg font-semibold ${ink}`}>What type of lockout?</h3>
                    <p className={`text-sm ${muted}`}>Help us understand your situation</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button size="lg" variant="outline" onClick={() => handleLockoutTypeSelect("car")} className={btnOutline + " h-12"}>
                    <Car className="mr-3 h-5 w-5 text-[#5D4037]" strokeWidth={1.65} />
                    Car Lockout
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleLockoutTypeSelect("house")} className={btnOutline + " h-12"}>
                    <Home className="mr-3 h-5 w-5 text-[#5D4037]" strokeWidth={1.65} />
                    House Lockout
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleLockoutTypeSelect("business")} className={btnOutline + " h-12"}>
                    <Building className="mr-3 h-5 w-5 text-[#5D4037]" strokeWidth={1.65} />
                    Business Lockout
                  </Button>
                </div>
              </div>
            )}

            {step === "details" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="ghost" onClick={handleBack} className="p-2 text-[#4a342c] hover:bg-[#efe8dd]">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className={`font-serif text-lg font-semibold ${ink}`}>Your details</h3>
                    <p className={`text-sm ${muted}`}>We need your contact information</p>
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-medium ${ink}`}>Your name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6d4c41]" />
                    <input
                      type="text"
                      value={request.customerName}
                      onChange={(e) => setRequest((prev) => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Enter your full name"
                      className={`${inputClass} rounded-sm pl-10 pr-4`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-medium ${ink}`}>Phone number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6d4c41]" />
                    <input
                      type="tel"
                      value={request.phoneNumber}
                      onChange={(e) => setRequest((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="(XXX) XXX-XXXX"
                      className={`${inputClass} rounded-sm pl-10 pr-4`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-medium ${ink}`}>Additional notes</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-[#6d4c41]" />
                    <textarea
                      value={request.notes}
                      onChange={(e) => setRequest((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Describe your situation…"
                      rows={4}
                      className={`${inputClass} resize-none rounded-sm pl-10 pr-4`}
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  disabled={!request.customerName.trim() || !request.phoneNumber.trim()}
                  onClick={handleNextToConfirm}
                  className={`${btnPrimary} transition-opacity disabled:cursor-not-allowed`}
                >
                  <CheckCircle className="mr-2 h-5 w-5" strokeWidth={1.75} />
                  Continue to confirm
                </Button>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="ghost" onClick={handleBack} className="p-2 text-[#4a342c] hover:bg-[#efe8dd]">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#5c6b4a]" strokeWidth={1.75} />
                    <h3 className={`font-serif text-lg font-semibold ${ink}`}>Confirm request</h3>
                  </div>
                </div>

                <div className={`space-y-3 rounded-sm border ${shellBorder} ${cream} p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${muted}`}>Service</span>
                    <span className={`text-sm font-medium ${ink}`}>{serviceSummaryLabel(request)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${muted}`}>Customer</span>
                    <span className={`text-sm font-medium ${ink}`}>{request.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${muted}`}>Phone</span>
                    <span className={`text-sm font-medium ${ink}`}>{request.phoneNumber}</span>
                  </div>
                  {request.notes ? (
                    <div className={`border-t ${shellBorder} pt-3`}>
                      <span className={`mb-2 block text-sm ${muted}`}>Notes</span>
                      <span className={`text-sm ${ink}`}>{request.notes}</span>
                    </div>
                  ) : null}
                </div>

                <Button size="lg" onClick={handleConfirmRequest} className={btnPrimary}>
                  <CheckCircle className="mr-2 h-5 w-5" strokeWidth={1.75} />
                  Confirm & dispatch
                </Button>
              </div>
            )}

            {step === "submitted" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div
                    className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border ${shellBorder} bg-[#efe8dd]`}
                  >
                    <CheckCircle className="h-10 w-10 text-[#5D4037]" strokeWidth={1.5} />
                  </div>
                  <h3 className={`mb-2 font-serif text-xl font-semibold ${ink}`}>Request submitted</h3>
                  <p className={`text-sm ${muted}`}>Your request has been received.</p>
                </div>

                <div className={`space-y-4 rounded-sm border ${shellBorder} ${cream} p-4`}>
                  <div className="text-center">
                    <div className={`mb-1 text-sm ${muted}`}>Submitted at</div>
                    <div className={`font-mono text-base ${ink}`}>{submissionTime}</div>
                  </div>

                  <div className={`border-t ${shellBorder} pt-4`}>
                    <div className={`mb-2 text-sm ${muted}`}>Service request</div>
                    <div className={`text-sm ${ink}`}>{serviceSummaryLabel(request)}</div>
                    <div className={`mt-1 text-sm ${ink}`}>
                      {request.customerName} · {request.phoneNumber}
                    </div>
                  </div>
                </div>

                <div className={`rounded-sm border ${shellBorder} bg-[#faf6f0] p-4`}>
                  <div className="mb-3 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-[#5D4037]" strokeWidth={1.65} />
                    <span className={`font-serif text-base font-semibold ${ink}`}>What happens next</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${muted}`}>
                    Our team will call you back within{" "}
                    <span className="font-semibold text-[#4a342c]">15 minutes</span> when we can help with your
                    request. Keep your phone nearby and consider answering unfamiliar numbers.
                  </p>
                </div>

                <Button size="lg" onClick={handleNewRequest} className={btnPrimary}>
                  Submit another request
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className={`border-t ${shellBorder} bg-[#efe8dd]/80 px-3 py-3 text-center sm:px-4`}>
          <p className="text-[10px] text-[#5d4037]/85 sm:text-xs">Licensed & insured · 24/7 emergency service</p>
        </div>
      </div>
    </div>
  )
}
