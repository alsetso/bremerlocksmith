import Stripe from "stripe"

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SANDBOX_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SANDBOX_SECRET_KEY is not set")
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, { typescript: true })
  }
  return stripeSingleton
}

export function getDefaultPriceId(): string {
  const id = process.env.STRIPE_SANDBOX_PRODUCT_PRICE_ID
  if (!id) {
    throw new Error("STRIPE_SANDBOX_PRODUCT_PRICE_ID is not set")
  }
  return id
}

/** Price IDs allowed for dashboard checkout (default service + optional $1 test). */
export function getAllowedPriceIds(): string[] {
  const primary = process.env.STRIPE_SANDBOX_PRODUCT_PRICE_ID
  const test = process.env.STRIPE_SANDBOX_TEST_SERVICE_PRICE_ID?.trim()
  const ids: string[] = []
  if (primary) ids.push(primary)
  if (test) ids.push(test)
  return [...new Set(ids)]
}

export function resolvePaymentPriceId(requested: string | undefined): string {
  const allowed = getAllowedPriceIds()
  if (allowed.length === 0) {
    throw new Error("No Stripe price IDs configured")
  }
  if (!requested?.trim()) return allowed[0]
  const id = requested.trim()
  if (!allowed.includes(id)) {
    throw new Error("Invalid price selection")
  }
  return id
}
