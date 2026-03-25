import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Accounts — Bremer Locksmith",
  description:
    "Complimentary annual lock assessment with onsite technical review and an annual security plan—Bremer Locksmith helps you understand your hardware and plan upgrades on your timeline.",
}

export default function AccountsPage() {
  redirect("/map?view=accounts")
}
