"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, MapPin } from "lucide-react"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<"minneapolis" | "bradenton">("minneapolis")

  const locations = {
    minneapolis: { city: "Minneapolis", state: "MN", phone: "(612) 555-0100" },
    bradenton: { city: "Bradenton", state: "FL", phone: "(941) 555-0200" },
  }

  return (
    <nav className="bg-black border-b border-border/50 backdrop-blur-sm z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-foreground tracking-tight">BREMER LOCKSMITH</h1>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 border border-border/50 rounded-lg px-3 py-1.5">
              <MapPin className="w-4 h-4 text-foreground/60" />
              <button
                onClick={() => setSelectedLocation("minneapolis")}
                className={`text-sm transition-colors duration-200 ${
                  selectedLocation === "minneapolis" ? "text-foreground font-medium" : "text-foreground/50"
                }`}
              >
                Minneapolis, MN
              </button>
              <span className="text-foreground/30">|</span>
              <button
                onClick={() => setSelectedLocation("bradenton")}
                className={`text-sm transition-colors duration-200 ${
                  selectedLocation === "bradenton" ? "text-foreground font-medium" : "text-foreground/50"
                }`}
              >
                Bradenton, FL
              </button>
            </div>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-foreground">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-border/50 animate-slide-up">
          <div className="px-4 pt-2 pb-3 space-y-2">
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-foreground/60" />
                <span className="text-sm text-foreground/60">Select Location:</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedLocation("minneapolis")}
                  className={`text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                    selectedLocation === "minneapolis"
                      ? "bg-foreground/10 text-foreground font-medium"
                      : "text-foreground/60"
                  }`}
                >
                  Minneapolis, MN
                </button>
                <button
                  onClick={() => setSelectedLocation("bradenton")}
                  className={`text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                    selectedLocation === "bradenton"
                      ? "bg-foreground/10 text-foreground font-medium"
                      : "text-foreground/60"
                  }`}
                >
                  Bradenton, FL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
