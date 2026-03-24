import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Drivers — Bremer Locksmith",
  description:
    "Join Bremer Locksmith as a field driver: choose your agency, enroll your vehicle, meet service requirements, and set availability—application opening soon.",
}

export default function DriversPage() {
  redirect("/?view=drivers")
}
