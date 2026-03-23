import type { Metadata } from "next"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { ComingSoon } from "@/components/coming-soon"

export const metadata: Metadata = {
  title: "Drivers — MNISR Immediate Service Response",
  description: "Driver portal and field tools — coming soon.",
}

export default function DriversPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <ComingSoon
        title="Drivers"
        description="A dedicated space for drivers is on the way — scheduling, routes, and in-field updates in one place."
      />
      <footer className="border-t border-zinc-200/80 py-4 text-center text-[11px] text-zinc-500">
        <Link href="/" className="font-medium text-teal-700 hover:text-teal-900">
          MNISR
        </Link>
        <span className="text-zinc-400"> · </span>
        <span>Immediate Service Response</span>
      </footer>
    </div>
  )
}
