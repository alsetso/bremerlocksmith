import { NextResponse } from "next/server"
import { getAllowedPriceIds, getStripe } from "@/lib/stripe-server"

export const dynamic = "force-dynamic"

/**
 * Lists fixed one-time prices allowed for in-app payment (catalog selector).
 */
export async function GET() {
  try {
    const stripe = getStripe()
    const ids = getAllowedPriceIds()
    if (ids.length === 0) {
      return NextResponse.json({ error: "No prices configured" }, { status: 500 })
    }

    const rows: Array<{
      priceId: string
      productId: string
      name: string
      description: string | null
      amount: number
      currency: string
      formatted: string
    }> = []

    for (const priceId of ids) {
      const price = await stripe.prices.retrieve(priceId, { expand: ["product"] })
      const product = price.product
      const name =
        typeof product !== "string" && !product.deleted ? product.name : "Service"
      const description =
        typeof product !== "string" && !product.deleted ? product.description : null

      if (price.unit_amount == null) continue

      rows.push({
        priceId: price.id,
        productId: typeof product === "string" ? product : product.id,
        name,
        description,
        amount: price.unit_amount,
        currency: price.currency,
        formatted: formatMoney(price.unit_amount, price.currency),
      })
    }

    rows.sort((a, b) => a.amount - b.amount)

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid fixed-amount prices" }, { status: 400 })
    }

    return NextResponse.json({ prices: rows })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load prices"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function formatMoney(unitAmount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(unitAmount / 100)
  } catch {
    return `${(unitAmount / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}
