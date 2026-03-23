import type { Metadata } from "next"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ComingSoon } from "@/components/coming-soon"

export const metadata: Metadata = {
  title: "Agencies — MNISR Immediate Service Response",
  description: "Agency tools and partnerships — coming soon.",
}

export default function AgenciesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ebe4d8]">
      <Navigation />
      <ComingSoon
        icon={<Building2 className="h-6 w-6 text-[#5D4037]" strokeWidth={1.65} aria-hidden />}
        title="Agencies"
        description="Resources for partner agencies will appear here. We are working on dashboards, dispatch coordination, and account tools."
      />
      <footer className="border-t border-[#c9b8a3] bg-[#e8dfd2] py-4 text-center text-[11px] text-[#5d4037]/85">
        <Link href="/" className="font-medium text-[#4a342c] hover:text-[#3e2723]">
          MNISR
        </Link>
        <span className="text-[#8d7b68]"> · </span>
        <span>Immediate Service Response</span>
      </footer>
    </div>
  )
}
