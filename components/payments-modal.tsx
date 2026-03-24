"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { CreditCard, Loader2, X } from "lucide-react"
import { getStripeBrowser } from "@/lib/stripe-client"
import { Button } from "@/components/ui/button"

type PricePayload = {
  priceId: string
  productId: string
  name: string
  description: string | null
  amount: number
  currency: string
  formatted: string
}

type Step = "email" | "pay" | "success"

interface PaymentsModalProps {
  isOpen: boolean
  onClose: () => void
  /** Inline panel inside the map bottom sheet (same pattern as immediate support). */
  variant?: "overlay" | "inline"
}

function InnerPayForm({
  email,
  onSuccess,
}: {
  email: string
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setCardError(null)
    setBusy(true)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/`,
        payment_method_data: {
          billing_details: { email },
        },
      },
      redirect: "if_required",
    })
    setBusy(false)
    if (error) {
      setCardError(error.message ?? "Payment failed")
      return
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3">
        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: { billingDetails: { email } },
          }}
        />
      </div>
      {cardError && <p className="text-sm text-red-400">{cardError}</p>}
      <Button
        type="submit"
        disabled={!stripe || busy}
        className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          "Pay now"
        )}
      </Button>
    </form>
  )
}

export function PaymentsModal({ isOpen, onClose, variant = "overlay" }: PaymentsModalProps) {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [prices, setPrices] = useState<PricePayload[]>([])
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [intentError, setIntentError] = useState<string | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [loadingIntent, setLoadingIntent] = useState(false)

  const stripePromise = getStripeBrowser()

  const selectedPrice = useMemo(
    () => prices.find((p) => p.priceId === selectedPriceId) ?? null,
    [prices, selectedPriceId],
  )

  const reset = useCallback(() => {
    setStep("email")
    setEmail("")
    setClientSecret(null)
    setIntentError(null)
    setCatalogError(null)
    setPrices([])
    setSelectedPriceId(null)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      reset()
      return
    }
    let cancelled = false
    setLoadingCatalog(true)
    setCatalogError(null)
    fetch("/api/stripe/prices")
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Could not load prices")
        return data as { prices: PricePayload[] }
      })
      .then((data) => {
        if (cancelled) return
        setPrices(data.prices)
        setSelectedPriceId(data.prices[0]?.priceId ?? null)
      })
      .catch((e: Error) => {
        if (!cancelled) setCatalogError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, reset])

  const handlePreparePayment = async () => {
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setIntentError("Enter a valid email address")
      return
    }
    if (!selectedPriceId) {
      setIntentError("Choose a service to pay for")
      return
    }
    setIntentError(null)
    setLoadingIntent(true)
    try {
      const res = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed.toLowerCase(), priceId: selectedPriceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not start payment")
      setClientSecret(data.clientSecret as string)
      setStep("pay")
    } catch (e) {
      setIntentError(e instanceof Error ? e.message : "Could not start payment")
    } finally {
      setLoadingIntent(false)
    }
  }

  if (!isOpen) return null

  const missingPk = !stripePromise
  const ready = !loadingCatalog && prices.length > 0 && selectedPriceId
  const titleId = variant === "inline" ? "payments-inline-title" : "payments-modal-title"

  const header = (
    <div className="flex shrink-0 items-center justify-between border-b border-zinc-700/60 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-emerald-400/90" strokeWidth={1.75} aria-hidden />
        <h2 id={titleId} className="font-serif text-base font-semibold text-zinc-100">
          Payments
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        aria-label={variant === "inline" ? "Back to dashboard" : "Close"}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )

  const scrollBody = (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          {missingPk && (
            <p className="text-sm text-amber-200/90">
              Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment.
            </p>
          )}

          {!missingPk && loadingCatalog && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading catalog…
            </div>
          )}

          {!missingPk && catalogError && <p className="text-sm text-red-400">{catalogError}</p>}

          {!missingPk && !loadingCatalog && ready && step === "email" && (
            <fieldset className="mb-4 space-y-2 border-0 p-0">
              <legend className="mb-2 block w-full text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                Choose service
              </legend>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Service to purchase">
                {prices.map((p) => {
                  const checked = selectedPriceId === p.priceId
                  return (
                    <label
                      key={p.priceId}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-colors sm:gap-3 sm:p-3 ${
                        checked
                          ? "border-emerald-500/55 bg-emerald-950/25 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.12)]"
                          : "border-zinc-700/70 bg-zinc-950/40 hover:border-zinc-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="service-price"
                        className="mt-1 h-3.5 w-3.5 shrink-0 accent-emerald-500"
                        checked={checked}
                        onChange={() => setSelectedPriceId(p.priceId)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-sm font-semibold leading-tight text-zinc-100">{p.name}</span>
                        {p.description && (
                          <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{p.description}</span>
                        )}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-emerald-400/95">{p.formatted}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          {!missingPk && !loadingCatalog && selectedPrice && step === "email" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-950/30 px-3 py-2 text-center">
                <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">Total due</p>
                <p className="mt-0.5 font-serif text-xl font-semibold tabular-nums text-zinc-100">{selectedPrice.formatted}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{selectedPrice.name}</p>
              </div>
              <label className="block text-xs font-medium text-zinc-400">
                Email (for receipt &amp; account lookup)
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-lg border border-zinc-600 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                />
              </label>
              <p className="text-[11px] leading-relaxed text-zinc-500">
                We match this email to an existing Stripe customer when possible, or create one—no separate sign-in
                required.
              </p>
              {intentError && <p className="text-sm text-red-400">{intentError}</p>}
              <Button
                type="button"
                onClick={() => void handlePreparePayment()}
                disabled={loadingIntent || !email.trim() || !selectedPriceId}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {loadingIntent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing…
                  </>
                ) : (
                  "Continue to card"
                )}
              </Button>
            </div>
          )}

          {!missingPk && !loadingCatalog && selectedPrice && step === "pay" && clientSecret && stripePromise && (
            <>
              <div className="mb-3 rounded-lg border border-zinc-700/50 bg-zinc-950/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] text-zinc-500">Paying</p>
                <p className="text-sm font-semibold text-zinc-100">
                  {selectedPrice.name}{" "}
                  <span className="tabular-nums text-emerald-400/95">{selectedPrice.formatted}</span>
                </p>
              </div>
              <button
                type="button"
                className="mb-3 text-left text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                onClick={() => {
                  setClientSecret(null)
                  setStep("email")
                  setIntentError(null)
                }}
              >
                ← Change email or service
              </button>
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#34d399",
                      colorBackground: "#09090b",
                      colorText: "#fafafa",
                      borderRadius: "8px",
                    },
                  },
                }}
              >
                <InnerPayForm email={email.trim().toLowerCase()} onSuccess={() => setStep("success")} />
              </Elements>
            </>
          )}

          {step === "success" && (
            <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 p-4 text-center">
              <p className="font-serif text-lg font-semibold text-emerald-200">Payment successful</p>
              <p className="mt-2 text-sm text-zinc-400">Thank you. A receipt will be sent to your email.</p>
              <Button
                type="button"
                className="mt-4 w-full bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          )}
    </div>
  )

  if (variant === "inline") {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        role="region"
        aria-labelledby={titleId}
      >
        {header}
        {scrollBody}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close payments"
      />
      <div className="relative z-[81] flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-zinc-600/80 bg-zinc-900 shadow-xl sm:rounded-2xl">
        {header}
        {scrollBody}
      </div>
    </div>
  )
}
