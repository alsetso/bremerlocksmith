/**
 * Shared labels and help copy for quick actions (mobile floating bar + parity with dashboard).
 * Icon mapping stays in UI components (Lucide).
 */
export const FLOATING_QUICK_ACTION_IDS = ["support", "location", "call", "text", "payments"] as const
export type FloatingQuickActionId = (typeof FLOATING_QUICK_ACTION_IDS)[number]

export type FloatingQuickActionMeta = {
  label: string
  description: string
  /** Primary button label in the expanded panel (omit when using a custom link label). */
  primaryCta?: string
}

export const floatingQuickActionMeta: Record<FloatingQuickActionId, FloatingQuickActionMeta> = {
  support: {
    label: "Immediate support",
    description:
      "Start a service request with your meeting location—we’ll route the right responder.",
    primaryCta: "Request support",
  },
  location: {
    label: "Location",
    description: "Set or adjust where we should meet you on the map.",
    primaryCta: "Open location",
  },
  call: {
    label: "Call",
    description: "Speak with dispatch now.",
  },
  text: {
    label: "Text",
    description: "Send a text to our line—we reply when available.",
    primaryCta: "Text us",
  },
  payments: {
    label: "Payments",
    description: "Cards, invoices, and payment status.",
    primaryCta: "Open payments",
  },
}
