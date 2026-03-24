import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Partners — Bremer Locksmith",
  description:
    "Bremer Locksmith partners with service-business owners across locksmith, towing, recovery, transport, and more—digital workspace and live vehicle location in one place.",
}

export default function PartnersPage() {
  redirect("/?view=partners")
}
