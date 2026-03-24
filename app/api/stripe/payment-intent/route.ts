import { NextResponse } from "next/server"
import { z } from "zod"
import { getStripe, resolvePaymentPriceId } from "@/lib/stripe-server"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  email: z.string().trim().email(),
  priceId: z.string().optional(),
})

/**
 * Creates a PaymentIntent for the default Price, with Stripe Customer lookup/create by email.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }
    const email = parsed.data.email.toLowerCase()
    const stripe = getStripe()
    const priceId = resolvePaymentPriceId(parsed.data.priceId)

    const price = await stripe.prices.retrieve(priceId)
    if (price.unit_amount == null) {
      return NextResponse.json(
        { error: "This price is not a fixed-amount line item." },
        { status: 400 },
      )
    }

    const existing = await stripe.customers.list({ email, limit: 1 })
    const customer =
      existing.data[0] ??
      (await stripe.customers.create({
        email,
        metadata: { source: "bremer_dashboard" },
      }))

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      customer: customer.id,
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      metadata: {
        price_id: price.id,
        customer_email: email,
      },
    })

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Could not create payment session" }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      existingCustomer: Boolean(existing.data[0]),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Payment setup failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
