import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Services — Bremer Locksmith",
  description:
    "Locksmith, keys, towing, ditch recovery, transportation, and more—custom keys, cuts, fobs, installs. Bremer Locksmith dispatches the right responder for your situation.",
}

export default function ServicesPage() {
  redirect("/map?view=services")
}
