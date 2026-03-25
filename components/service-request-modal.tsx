"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
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
  BusFront,
  Mountain,
  KeyRound,
} from "lucide-react"

interface ServiceRequestModalProps {
  isOpen: boolean
  onClose: () => void
  userLocation: [number, number]
  userAddress: string
  coordinates: string
  /** No confirmed address yet (e.g. user skipped location). */
  locationPending?: boolean
  /** User picked a place name / address instead of live GPS. */
  addressLabel?: string | null
  /** Meeting point follows device GPS on the map — hide separate movement toggle. */
  liveMeetingLockedToGps?: boolean
  deviceLiveTracking?: boolean
  onDeviceLiveTrackingChange?: (on: boolean) => void
  liveDeviceCoordsLine?: string | null
  /** Opens the location picker (search, map pin, or live GPS) below the map. */
  onEditLocation?: () => void
  initialServiceType?: "lockout" | "other" | "towing" | "ditch_recovery"
  initialLockoutType?: "car" | "house" | "business" | "truck" | "semi"
  variant?: "overlay" | "inline"
}

interface TechnicianRequest {
  serviceType: "lockout" | "other" | "towing" | "ditch_recovery" | ""
  lockoutType: "car" | "house" | "business" | "truck" | "semi" | ""
  customerName: string
  phoneNumber: string
  notes: string
}

const ink = "text-zinc-100"
const muted = "text-zinc-400"
const btnChoice =
  "group w-full cursor-pointer touch-manipulation justify-start gap-3 border border-zinc-600/80 bg-zinc-900/40 text-zinc-100 shadow-none transition-colors duration-150 h-11 sm:h-12 font-medium hover:border-zinc-500 hover:bg-zinc-800/80 active:scale-[0.99] active:border-zinc-500 active:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 [&_svg]:transition-colors [&_svg]:group-hover:text-zinc-100"
const inputClass =
  "w-full cursor-text rounded-md border border-zinc-600/80 bg-zinc-950/80 py-2.5 pl-10 pr-3 text-sm text-zinc-100 shadow-none transition-colors duration-150 placeholder:text-zinc-500 hover:border-zinc-500/70 hover:bg-zinc-900/60 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/35 focus:ring-offset-0 active:border-zinc-500"
const btnPrimary =
  "w-full cursor-pointer touch-manipulation border border-zinc-300 bg-zinc-100 text-zinc-900 shadow-none transition-all duration-150 h-11 font-semibold hover:bg-white hover:border-zinc-200 active:scale-[0.99] active:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-45"
const headerBtn =
  "cursor-pointer touch-manipulation transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-700 active:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
const btnComingSoon =
  `${btnChoice} !cursor-not-allowed border-zinc-700/50 !opacity-65 hover:!border-zinc-700/50 hover:!bg-zinc-900/40 active:!scale-100 [&_svg]:!text-zinc-500`

export function ServiceRequestModal({
  isOpen,
  onClose,
  userLocation,
  userAddress,
  coordinates,
  locationPending = false,
  addressLabel,
  liveMeetingLockedToGps = false,
  deviceLiveTracking = false,
  onDeviceLiveTrackingChange,
  liveDeviceCoordsLine = null,
  onEditLocation,
  initialServiceType,
  initialLockoutType,
  variant = "overlay",
}: ServiceRequestModalProps) {
  const inline = variant === "inline"
  const isLiveLocation = !locationPending && !addressLabel?.trim()
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
      return `Emergency Lockout${r.lockoutType ? ` — ${r.lockoutType.charAt(0).toUpperCase()}${r.lockoutType.slice(1)}` : ""}`
    }
    if (r.serviceType === "towing") return "Towing"
    if (r.serviceType === "ditch_recovery") return "Ditch Recovery"
    return "Other Key Services"
  }

  const { stepIndex, totalSteps, stepLabel } = useMemo(() => {
    const lockoutPath = request.serviceType === "lockout"
    const order: { id: typeof step; label: string }[] = lockoutPath
      ? [
          { id: "service", label: "Service" },
          { id: "lockout-type", label: "Type" },
          { id: "details", label: "Contact" },
          { id: "confirm", label: "Review" },
          { id: "submitted", label: "Done" },
        ]
      : [
          { id: "service", label: "Service" },
          { id: "details", label: "Contact" },
          { id: "confirm", label: "Review" },
          { id: "submitted", label: "Done" },
        ]
    const idx = order.findIndex((s) => s.id === step)
    const current = order[Math.max(0, idx)]?.label ?? ""
    return {
      stepIndex: idx >= 0 ? idx + 1 : 1,
      totalSteps: order.length,
      stepLabel: current,
    }
  }, [step, request.serviceType])

  const handleServiceTypeSelect = (serviceType: "lockout") => {
    setRequest((prev) => ({
      ...prev,
      serviceType,
      lockoutType: prev.lockoutType,
    }))
    setStep("lockout-type")
  }

  const handleLockoutTypeSelect = (lockoutType: "car" | "house" | "business" | "truck" | "semi") => {
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
          coordinates: coordinates.trim() || "Not provided",
          liveDeviceCoordinates:
            deviceLiveTracking && liveDeviceCoordsLine?.trim() ? liveDeviceCoordsLine.trim() : undefined,
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

  const showBackButton = step !== "submitted"
  const handleBackPress = () => {
    if (step === "service") {
      handleClose()
    } else {
      handleBack()
    }
  }

  if (!isOpen) {
    return null
  }

  const scrollClass = inline ? "min-h-0 flex-1 overflow-y-auto" : "max-h-[calc(85vh-120px)] overflow-y-auto sm:max-h-[calc(90vh-140px)]"

  const shellOuter = inline
    ? "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden text-zinc-200"
    : "relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-700/90 bg-zinc-950 text-zinc-200 shadow-2xl"

  const panelShell = (
    <div className={shellOuter} role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
      <div className="flex shrink-0 items-center justify-between gap-2 px-1 pb-2 pt-0 sm:px-0">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showBackButton ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleBackPress}
              aria-label={step === "service" ? "Back to quick actions" : "Back"}
              className={`h-8 shrink-0 px-2 text-zinc-400 ${headerBtn}`}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <span className="w-8 shrink-0" aria-hidden />
          )}
          <div className="min-w-0">
            <h2 id="service-modal-title" className={`truncate font-serif text-sm font-semibold ${ink}`}>
              {step === "submitted" ? "Request sent" : "Get service"}
            </h2>
            {step !== "submitted" && (
              <p className={`text-[10px] uppercase tracking-[0.14em] ${muted}`}>
                Step {stepIndex} of {totalSteps} · {stepLabel}
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleClose}
          className={`h-8 w-8 shrink-0 p-0 text-zinc-400 ${headerBtn}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className={`shrink-0 space-y-2 border-b border-zinc-700/60 pb-3 text-[11px] ${muted}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {locationPending ? (
              <span className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/90">
                Location needed
              </span>
            ) : isLiveLocation ? (
              <span className="shrink-0 rounded-md border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300/90">
                Live location
              </span>
            ) : (
              <span className="shrink-0 rounded-md border border-sky-500/35 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-300/90">
                Saved address
              </span>
            )}
          </div>
          {onEditLocation ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onEditLocation}
              className="h-auto shrink-0 px-1.5 py-0.5 text-[11px] font-medium text-sky-300/90 hover:bg-zinc-800/80 hover:text-sky-200 hover:underline"
            >
              Change location
            </Button>
          ) : null}
        </div>
        <p className="line-clamp-3 leading-snug">{userAddress}</p>
        {coordinates.trim() ? (
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
            <Navigation className="h-3 w-3 shrink-0" aria-hidden />
            {coordinates}
          </div>
        ) : null}
        {liveMeetingLockedToGps ? (
          <p className={`text-[10px] leading-snug ${muted}`}>
            Meeting point follows your GPS on the map. Dispatch uses that path — no separate movement link needed.
          </p>
        ) : onDeviceLiveTrackingChange ? (
          <div className="flex flex-col gap-2 rounded-md border border-zinc-700/70 bg-zinc-900/40 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-medium leading-tight ${ink}`}>Share live movement</span>
              <button
                type="button"
                role="switch"
                aria-checked={deviceLiveTracking}
                onClick={() => onDeviceLiveTrackingChange(!deviceLiveTracking)}
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
                  deviceLiveTracking ? "bg-emerald-600/90" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    deviceLiveTracking ? "left-[1.125rem]" : "left-0.5"
                  }`}
                />
                <span className="sr-only">{deviceLiveTracking ? "On" : "Off"}</span>
              </button>
            </div>
            <p className={`text-[10px] leading-snug ${muted}`}>
              Optional: send updating coordinates while you move. Meeting location above can stay fixed (e.g. building
              entrance).
            </p>
            {deviceLiveTracking && liveDeviceCoordsLine?.trim() ? (
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400/90">
                <Navigation className="h-3 w-3 shrink-0" aria-hidden />
                Live: {liveDeviceCoordsLine.trim()}
              </div>
            ) : deviceLiveTracking ? (
              <p className={`text-[10px] ${muted}`}>Waiting for GPS…</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={scrollClass}>
        <div className="space-y-4 px-0 py-3 sm:py-4">
          {step === "service" && (
            <div className="space-y-3">
              <p className={`text-xs ${muted}`}>What do you need?</p>
              <div className="space-y-2">
                <Button type="button" size="lg" variant="outline" onClick={() => handleServiceTypeSelect("lockout")} className={btnChoice}>
                  <KeyRound className="h-5 w-5 shrink-0 text-zinc-300" strokeWidth={1.65} />
                  Emergency Lockout
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => toast.info("Towing is coming soon")}
                  className={btnComingSoon}
                >
                  <Truck className="h-5 w-5 shrink-0 text-zinc-300" strokeWidth={1.65} />
                  <span className="flex flex-col items-start gap-0.5 text-left">
                    <span>Towing</span>
                    <span className="text-[11px] font-normal normal-case tracking-normal text-zinc-500">Coming soon</span>
                  </span>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => toast.info("Ditch recovery is coming soon")}
                  className={btnComingSoon}
                >
                  <Mountain className="h-5 w-5 shrink-0 text-zinc-300" strokeWidth={1.65} />
                  <span className="flex flex-col items-start gap-0.5 text-left">
                    <span>Ditch Recovery</span>
                    <span className="text-[11px] font-normal normal-case tracking-normal text-zinc-500">Coming soon</span>
                  </span>
                </Button>
              </div>
            </div>
          )}

          {step === "lockout-type" && (
            <div className="space-y-3">
              <p className={`text-xs ${muted}`}>Where are you locked out?</p>
              <div className="space-y-2">
                <Button type="button" size="lg" variant="outline" onClick={() => handleLockoutTypeSelect("car")} className={btnChoice}>
                  <Car className="h-5 w-5 text-zinc-300" strokeWidth={1.65} />
                  Car
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={() => handleLockoutTypeSelect("house")} className={btnChoice}>
                  <Home className="h-5 w-5 text-zinc-300" strokeWidth={1.65} />
                  House
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={() => handleLockoutTypeSelect("business")} className={btnChoice}>
                  <Building className="h-5 w-5 text-zinc-300" strokeWidth={1.65} />
                  Business
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={() => handleLockoutTypeSelect("truck")} className={btnChoice}>
                  <Truck className="h-5 w-5 text-zinc-300" strokeWidth={1.65} />
                  Truck
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={() => handleLockoutTypeSelect("semi")} className={btnChoice}>
                  <BusFront className="h-5 w-5 text-zinc-300" strokeWidth={1.65} />
                  Semi
                </Button>
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              <p className={`text-xs ${muted}`}>How can we reach you?</p>
              <div>
                <label className={`mb-1.5 block text-[11px] font-medium ${ink}`}>Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={request.customerName}
                    onChange={(e) => setRequest((prev) => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Full name"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={`mb-1.5 block text-[11px] font-medium ${ink}`}>Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="tel"
                    value={request.phoneNumber}
                    onChange={(e) => setRequest((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="(555) 555-5555"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={`mb-1.5 block text-[11px] font-medium ${ink}`}>Notes</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <textarea
                    value={request.notes}
                    onChange={(e) => setRequest((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Anything else we should know…"
                    rows={3}
                    className={`${inputClass} resize-none py-3`}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={!request.customerName.trim() || !request.phoneNumber.trim()}
                onClick={handleNextToConfirm}
                className={`${btnPrimary} disabled:cursor-not-allowed`}
              >
                <CheckCircle className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Continue
              </Button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <p className={`text-xs ${muted}`}>Review and send</p>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-zinc-700/50 pb-2">
                  <dt className={muted}>Service</dt>
                  <dd className={`text-right font-medium ${ink}`}>{serviceSummaryLabel(request)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-zinc-700/50 pb-2">
                  <dt className={muted}>Name</dt>
                  <dd className={`text-right font-medium ${ink}`}>{request.customerName}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-zinc-700/50 pb-2">
                  <dt className={muted}>Phone</dt>
                  <dd className={`text-right font-medium ${ink}`}>{request.phoneNumber}</dd>
                </div>
                {request.notes ? (
                  <div className="pt-1">
                    <dt className={`mb-1 ${muted}`}>Notes</dt>
                    <dd className={`${ink}`}>{request.notes}</dd>
                  </div>
                ) : null}
                {deviceLiveTracking && liveDeviceCoordsLine?.trim() ? (
                  <div className="flex justify-between gap-4 border-t border-zinc-700/50 pt-2">
                    <dt className={muted}>Live device</dt>
                    <dd className={`text-right font-mono text-[11px] ${ink}`}>{liveDeviceCoordsLine.trim()}</dd>
                  </div>
                ) : null}
              </dl>
              <Button type="button" variant="ghost" size="lg" onClick={handleConfirmRequest} className={btnPrimary}>
                <CheckCircle className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Confirm & dispatch
              </Button>
            </div>
          )}

          {step === "submitted" && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500/90" strokeWidth={1.5} />
                <h3 className={`font-serif text-lg font-semibold ${ink}`}>We received your request</h3>
                <p className={`text-sm ${muted}`}>Submitted {submissionTime}</p>
              </div>
              <div className={`space-y-2 text-sm ${muted}`}>
                <p>
                  <span className="text-zinc-300">{serviceSummaryLabel(request)}</span>
                  <span className="text-zinc-600"> · </span>
                  <span>{request.customerName}</span>
                  <span className="text-zinc-600"> · </span>
                  <span>{request.phoneNumber}</span>
                </p>
                <p className="leading-relaxed">
                  We will call you back within <span className="font-medium text-zinc-300">15 minutes</span> when we can
                  help. Keep your phone nearby.
                </p>
              </div>
              <Button type="button" variant="ghost" size="lg" onClick={handleNewRequest} className={btnPrimary}>
                Submit another request
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={`shrink-0 pt-2 text-center text-[10px] ${muted}`}>
        We find licensed &amp; insured professionals 24/7 and get them the fastest route to you.
      </div>
    </div>
  )

  if (inline) {
    return panelShell
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={handleClose} aria-hidden />
      {panelShell}
    </div>
  )
}
